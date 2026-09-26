// Merges creatrip_place_DB/curated/*.json (one file per source folder, produced from the raw
// Creatrip page dumps), geocodes addresses, and writes:
//   - src/data/glowUpPlaces.json   (bundled fallback / dev data)
//   - supabase/seed_places.sql     (same rows for the Supabase `places` tables)
//   - creatrip_place_DB/build-report.md
// Usage: node scripts/build-places.mjs [--no-geocode]
// Geocoding uses Google Places Text Search (Pro field mask) with GOOGLE_PLACES_API_KEY from
// .env.local. Anything that can't be placed confidently falls back to the district centre
// with coordApprox = true.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curatedDir = path.join(root, 'creatrip_place_DB', 'curated');
// Name-only Google hits that were checked by hand and are a different venue (kept at the district centre).
const REJECT_GEOCODE = new Set(['13165', '13789']);
const noGeocode = process.argv.includes('--no-geocode');

const CENTRES = {
  gangnam: [37.5172, 127.0473],
  'hongdae-mapo': [37.5563, 126.9236],
  myeongdong: [37.5636, 126.9822],
  seongsu: [37.5446, 127.0557],
  seomyeon: [35.1579, 129.0595],
  haeundae: [35.1631, 129.1635],
  gwangalli: [35.1532, 129.1186],
  nampo: [35.098, 129.0324],
};
const CITY_CENTRE = { seoul: [37.5665, 126.978], busan: [35.1796, 129.0756] };

function loadEnv() {
  const env = {};
  const p = path.join(root, '.env.local');
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const km = (a, b) => {
  const R = 6371;
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const empty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
const score = (r) => Object.values(r).reduce((n, v) => n + (empty(v) ? 0 : 1), 0);

function mergeRecords(records) {
  const sorted = [...records].sort((a, b) => score(b) - score(a));
  const out = { ...sorted[0] };
  for (const r of sorted.slice(1)) {
    for (const [k, v] of Object.entries(r)) if (empty(out[k])) out[k] = v;
    out.extraSubtypes = [...new Set([...(out.extraSubtypes ?? []), ...(r.extraSubtypes ?? [])])];
  }
  out.extraSubtypes = (out.extraSubtypes ?? []).filter((s) => s !== out.subtype);
  return out;
}

async function geocode(place, key) {
  const queries = [
    place.addressKo,
    place.addressEn && `${place.name} ${place.addressEn}`,
    `${place.name} ${place.branch ?? ''} ${place.city}`.replace(/\s+/g, ' '),
  ].filter(Boolean);
  const centre = (place.region && CENTRES[place.region]) || CITY_CENTRE[place.city] || CITY_CENTRE.seoul;
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  for (const [i, q] of queries.entries()) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({ textQuery: q, languageCode: 'en', regionCode: 'KR', pageSize: 1 }),
    });
    if (!res.ok) continue;
    const json = await res.json();
    const hit = json.places?.[0];
    if (!hit?.location) continue;
    const pt = [hit.location.latitude, hit.location.longitude];
    // Reject hits far from where the address says we should be (wrong branch / namesake).
    if (km(pt, centre) > 8) continue;
    // A hit found from a street address, or whose listed name matches the venue, is trusted; a
    // name-only search that returned something with a different name is only a rough location.
    const viaAddress = i < queries.length - 1 || (i === 0 && Boolean(place.addressKo));
    const nameMatch = norm(hit.displayName?.text).includes(norm(place.name).slice(0, 6));
    return { lat: pt[0], lng: pt[1], via: q, approx: !(viaAddress || nameMatch), got: hit.displayName?.text };
  }
  return null;
}

// Some dumps only show KRW prices. Converted at a fixed ~1,400 KRW/USD and rounded; the app prefixes
// prices with "~" so they read as approximate.
const KRW_PER_USD = 1400;
const toUsd = (usd, krw) => (usd != null ? usd : krw != null ? Math.round(krw / KRW_PER_USD) : null);

const lowestPrice = (products) => {
  const prices = products.map((x) => x.priceUsd).filter((n) => n != null && n > 0);
  return prices.length ? Math.min(...prices) : null;
};

const esc = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v == null ? 'null' : String(v));
const arr = (a) => `array[${(a ?? []).map(esc).join(', ')}]::text[]`;

async function main() {
  const files = fs.readdirSync(curatedDir).filter((f) => f.endsWith('.json'));
  const byId = new Map();
  for (const f of files) {
    for (const rec of JSON.parse(fs.readFileSync(path.join(curatedDir, f), 'utf8'))) {
      byId.set(rec.id, [...(byId.get(rec.id) ?? []), rec]);
    }
  }

  const key = loadEnv().GOOGLE_PLACES_API_KEY;
  const report = { total: 0, geocoded: [], approx: [], conflicts: [], noRegion: [] };
  const places = [];

  for (const [id, recs] of byId) {
    const p = mergeRecords(recs);
    const subtypes = new Set(recs.map((r) => r.subtype));
    if (subtypes.size > 1) report.conflicts.push(`${id} ${p.name}: ${[...subtypes].join(' vs ')} (kept ${p.subtype})`);
    if (!p.region) report.noRegion.push(`${id} ${p.name}`);

    let lat = null;
    let lng = null;
    let coordApprox = false;
    if (!noGeocode && key && !REJECT_GEOCODE.has(id)) {
      const g = await geocode(p, key).catch(() => null);
      if (g) {
        lat = g.lat;
        lng = g.lng;
        coordApprox = g.approx;
        (g.approx ? report.approx : report.geocoded).push(`${id} ${p.name} <- ${g.via} => "${g.got}"`);
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    if (lat == null) {
      const c = (p.region && CENTRES[p.region]) || CITY_CENTRE[p.city] || CITY_CENTRE.seoul;
      // Spread same-district fallbacks a little so approximate pins don't stack exactly.
      lat = +(c[0] + ((Number(id) % 7) - 3) * 0.0012).toFixed(6);
      lng = +(c[1] + (((Number(id) >> 3) % 7) - 3) * 0.0012).toFixed(6);
      coordApprox = true;
      report.approx.push(`${id} ${p.name} (${p.region ?? p.city}) — district centre`);
    }

    const products = (p.products ?? []).map((x) => ({
      name: x.name,
      priceUsd: toUsd(x.priceUsd, x.priceKrw),
      originalPriceUsd: toUsd(x.originalPriceUsd, x.originalPriceKrw),
    }));

    places.push({
      id,
      name: p.name,
      branch: p.branch ?? null,
      tagline: p.tagline ?? null,
      subtype: p.subtype,
      extraSubtypes: p.extraSubtypes ?? [],
      city: p.city ?? 'seoul',
      region: p.region ?? null,
      addressEn: p.addressEn ?? null,
      addressKo: p.addressKo ?? null,
      lat,
      lng,
      coordApprox,
      rating: p.rating ?? null,
      reviewCount: p.reviewCount ?? null,
      languages: p.languages ?? [],
      koreanOnlyStaff: Boolean(p.koreanOnlyStaff),
      englishSupport: p.englishSupport ?? null,
      subway: p.subway ?? null,
      hours: p.hours ?? null,
      products,
      priceFromUsd: p.priceFromUsd ?? lowestPrice(products),
      minutes: p.minutes ?? null,
      downtime: p.downtime ?? null,
      downtimeNote: p.downtimeNote ?? null,
      beforeYouBook: p.beforeYouBook ?? [],
      reservationConfirm: p.reservationConfirm ?? null,
      highlights: p.highlights ?? [],
    });
  }
  places.sort((a, b) => a.id.localeCompare(b.id));
  report.total = places.length;

  fs.writeFileSync(path.join(root, 'src', 'data', 'glowUpPlaces.json'), JSON.stringify(places, null, 2) + '\n');

  const rows = places.map(
    (p) =>
      '(' +
      [
        esc(p.id), esc(p.name), esc(p.branch), esc(p.tagline), esc(p.subtype), arr(p.extraSubtypes), esc(p.city), esc(p.region),
        esc(p.addressEn), esc(p.addressKo), num(p.lat), num(p.lng), p.coordApprox, num(p.rating), num(p.reviewCount),
        arr(p.languages), p.koreanOnlyStaff, p.englishSupport == null ? 'null' : p.englishSupport, esc(p.subway), esc(p.hours),
        num(p.priceFromUsd), num(p.minutes), esc(p.downtime), esc(p.downtimeNote), arr(p.beforeYouBook),
        esc(p.reservationConfirm), arr(p.highlights),
      ].join(', ') +
      ')'
  );
  const prodRows = places.flatMap((p) =>
    p.products.map(
      (x, i) =>
        '(' +
        [esc(p.id), i, esc(x.name), num(x.priceUsd), num(x.originalPriceUsd), esc(`https://creatrip.com/en/spot/${p.id}`)].join(', ') +
        ')'
    )
  );
  const sql = [
    '-- Generated by scripts/build-places.mjs from creatrip_place_DB/curated/*.json - do not hand-edit.',
    '-- Run supabase/places_schema.sql first.',
    'begin;',
    'truncate public.place_products, public.places cascade;',
    '',
    'insert into public.places',
    '  (id, name, branch, tagline, subtype, extra_subtypes, city, region, address_en, address_ko, lat, lng, coord_approx,',
    '   rating, review_count, languages, korean_only_staff, english_support, subway, hours, price_from_usd, minutes,',
    '   downtime, downtime_note, before_you_book, reservation_confirm, highlights)',
    'values',
    rows.join(',\n') + ';',
    '',
    prodRows.length
      ? 'insert into public.place_products (place_id, position, name, price_usd, original_price_usd, booking_url)\nvalues\n' +
        prodRows.join(',\n') +
        ';'
      : '',
    'commit;',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'supabase', 'seed_places.sql'), sql);

  const md = [
    '# Place DB build report',
    '',
    `Places written: ${report.total}`,
    '',
    `## Geocoded (${report.geocoded.length})`,
    ...report.geocoded.map((s) => `- ${s}`),
    '',
    `## Approximate coordinates (${report.approx.length}) - flagged coordApprox; name-only match or district-centre fallback`,
    ...report.approx.map((s) => `- ${s}`),
    '',
    `## Subtype conflicts between source folders (${report.conflicts.length})`,
    ...report.conflicts.map((s) => `- ${s}`),
    '',
    `## No region (${report.noRegion.length})`,
    ...report.noRegion.map((s) => `- ${s}`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'creatrip_place_DB', 'build-report.md'), md);
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
