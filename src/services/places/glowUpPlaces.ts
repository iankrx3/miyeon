import type {
  GlowUpCity,
  GlowUpDowntime,
  GlowUpLanguage,
  GlowUpPlace,
  GlowUpRegion,
  GlowUpSubtype,
} from '../../types';
import { supabase } from '../../lib/supabase';
import { withCreatripAffiliate } from '../../lib/creatrip';
import bundled from '../../data/glowUpPlaces.json';

/** Direct Creatrip product page for a venue (its Creatrip spot id), with affiliate params. */
export const creatripSpotUrl = (id: string): string => withCreatripAffiliate(`https://creatrip.com/en/spot/${id}`);

/** A row of the Supabase `places` table (supabase/places_schema.sql) — same shape as the bundled JSON. */
interface PlaceRow {
  id: string;
  name: string;
  subtype: string;
  extra_subtypes: string[] | null;
  onboarding: string;
  city: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  nearest_station: string | null;
  price_type: string;
  price_min_usd: number | string | null;
  deposit_usd: number | string | null;
  languages: { code: string; source: string }[] | null;
  duration_min: number | null;
  hours: string | null;
  closed_days: string[] | null;
  fix_targets: string[] | null;
  downtime_grade: string | null;
  downtime_days_max: number | null;
  rating: number | string | null;
  review_count: number | null;
  active: boolean;
}

const SUBTYPES: Record<string, GlowUpSubtype> = {
  hair_salon: 'hair',
  nail_art: 'nail',
  personal_color: 'personal-color',
  makeup: 'makeup',
  permanent_makeup: 'permanent-makeup',
  photo_studio: 'photo',
  sauna: 'sauna',
  body_scrub: 'scrub',
  massage: 'massage',
  yoga_wellness: 'yoga',
};

const REGIONS: Record<string, Exclude<GlowUpRegion, 'auto'>> = {
  gangnam: 'gangnam',
  apgujeong: 'gangnam',
  sinsa: 'gangnam',
  hongdae: 'hongdae-mapo',
  mapo: 'hongdae-mapo',
  hapjeong: 'hongdae-mapo',
  sangsu: 'hongdae-mapo',
  sinchon: 'hongdae-mapo',
  myeongdong: 'myeongdong',
  junggu: 'myeongdong',
  euljiro: 'myeongdong',
  chungmuro: 'myeongdong',
  seongsudong: 'seongsu',
  seongdong: 'seongsu',
  seomyeon: 'seomyeon',
  busanjin: 'seomyeon',
  haeundae: 'haeundae',
  gwangalli: 'gwangalli',
  suyeong: 'gwangalli',
  nampo: 'nampo',
};

const LANGUAGES: Record<string, GlowUpLanguage> = {
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  vi: 'Vietnamese',
  th: 'Thai',
};

const DOWNTIME: Record<string, GlowUpDowntime> = { none: 'none', low: 'mild', high: 'days' };

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const toNum = (v: number | string | null): number | null => (v == null ? null : Number(v));

/** Dermatology rows become 'skin' / 'face' from their FIX targets; other subtypes map 1:1. */
function subtypesOf(row: PlaceRow): GlowUpSubtype[] {
  const main: GlowUpSubtype[] = [];
  if (row.subtype === 'dermatology') {
    for (const t of row.fix_targets ?? []) if (t === 'skin' || t === 'face') main.push(t);
    if (main.length === 0) main.push('skin');
  } else if (SUBTYPES[row.subtype]) {
    main.push(SUBTYPES[row.subtype]);
  }
  const extra = (row.extra_subtypes ?? []).map((s) => SUBTYPES[s]).filter(Boolean);
  return [...new Set([...main, ...extra])];
}

/** "mon closed; tue 10:00-19:00; ..." -> "Tue-Sun 10:00-19:00 · closed Mon". */
function formatHours(hours: string | null): string | null {
  if (!hours) return null;
  const byDay = new Map<string, string>();
  for (const part of hours.split(';')) {
    const [day, ...rest] = part.trim().split(' ');
    byDay.set(day, rest.join(' '));
  }
  const groups: { from: string; to: string; value: string }[] = [];
  for (const day of DAYS) {
    const value = byDay.get(day);
    if (!value || value === 'closed') continue;
    const last = groups[groups.length - 1];
    if (last && last.value === value && DAYS.indexOf(last.to) === DAYS.indexOf(day) - 1) last.to = day;
    else groups.push({ from: day, to: day, value });
  }
  const open = groups.map((g) => `${cap(g.from)}${g.from === g.to ? '' : `-${cap(g.to)}`} ${g.value}`);
  const closed = DAYS.filter((d) => byDay.get(d) === 'closed').map(cap);
  if (closed.length) open.push(`closed ${closed.join(', ')}`);
  return open.join(' · ') || null;
}

function fromRow(row: PlaceRow): GlowUpPlace | null {
  const city = row.city.toLowerCase();
  const [subtype, ...extraSubtypes] = subtypesOf(row);
  if (!row.active || !subtype || (city !== 'seoul' && city !== 'busan')) return null;

  const [name, ...taglineParts] = row.name.split(' | ');
  const langs = row.languages ?? [];
  const deposit = toNum(row.deposit_usd);
  const downtimeDays = row.downtime_days_max ?? 0;

  const beforeYouBook: string[] = [];
  if (row.price_type === 'deposit' && deposit != null) {
    beforeYouBook.push(`Deposit of $${deposit.toFixed(2)} at booking; pay the rest onsite`);
  }
  if (row.price_type === 'free_reservation') beforeYouBook.push('Free reservation; pay onsite');
  if (row.closed_days?.length) beforeYouBook.push(`Closed ${row.closed_days.map(cap).join(', ')}`);

  return {
    id: row.id,
    name: name.trim(),
    branch: null,
    tagline: taglineParts.join(' | ').trim() || null,
    subtype,
    extraSubtypes,
    city: city as GlowUpCity,
    region: (row.region && REGIONS[row.region.toLowerCase()]) || null,
    addressEn: null,
    addressKo: row.address,
    lat: row.lat,
    lng: row.lng,
    coordApprox: false,
    rating: toNum(row.rating),
    reviewCount: row.review_count,
    languages: [...new Set(langs.filter((l) => l.source === 'listed' && LANGUAGES[l.code]).map((l) => LANGUAGES[l.code]))],
    koreanOnlyStaff: langs.length > 0 && langs.every((l) => l.code === 'ko'),
    englishSupport: langs.some((l) => l.code === 'en') ? true : langs.length > 0 ? false : null,
    subway: row.nearest_station,
    hours: formatHours(row.hours),
    products: [],
    priceFromUsd: toNum(row.price_min_usd),
    minutes: row.duration_min,
    downtime: row.downtime_grade ? (DOWNTIME[row.downtime_grade] ?? null) : null,
    downtimeNote: downtimeDays > 0 ? `Up to ${downtimeDays} day${downtimeDays > 1 ? 's' : ''} of downtime` : null,
    beforeYouBook,
    reservationConfirm: null,
    highlights: [],
    bookingUrl: creatripSpotUrl(row.id),
  };
}

const toPlaces = (rows: PlaceRow[]): GlowUpPlace[] => rows.map(fromRow).filter((p): p is GlowUpPlace => p !== null);

async function fetchFromSupabase(): Promise<GlowUpPlace[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('places').select('*').eq('active', true);
  if (error || !data) return [];
  return toPlaces(data as PlaceRow[]);
}

let cache: Promise<GlowUpPlace[]> | null = null;

/** Places for the Glow Up result: Supabase `places` when it has rows, otherwise the bundled
 * seed (src/data/glowUpPlaces.json, same rows). Memoized for the session. */
export function loadGlowUpPlaces(): Promise<GlowUpPlace[]> {
  cache ??= (async () => {
    try {
      const remote = await fetchFromSupabase();
      if (remote.length > 0) return remote;
    } catch {
      // fall through to the bundled seed
    }
    return toPlaces(bundled as PlaceRow[]);
  })();
  return cache;
}

export async function getGlowUpPlace(id: string): Promise<GlowUpPlace | undefined> {
  return (await loadGlowUpPlaces()).find((p) => p.id === id);
}
