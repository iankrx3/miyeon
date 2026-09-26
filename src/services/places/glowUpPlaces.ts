import type { GlowUpDowntime, GlowUpLanguage, GlowUpPlace, GlowUpProduct, GlowUpSubtype } from '../../types';
import { supabase } from '../../lib/supabase';
import { withCreatripAffiliate } from '../../lib/creatrip';
import bundled from '../../data/glowUpPlaces.json';

/** Direct Creatrip product page for a venue (its Creatrip spot id), with affiliate params. */
export const creatripSpotUrl = (id: string): string => withCreatripAffiliate(`https://creatrip.com/en/spot/${id}`);

type PlaceInput = Omit<GlowUpPlace, 'bookingUrl'>;

const withUrl = (p: PlaceInput): GlowUpPlace => ({ ...p, bookingUrl: creatripSpotUrl(p.id) });

interface PlaceRow {
  id: string;
  name: string;
  branch: string | null;
  tagline: string | null;
  subtype: GlowUpSubtype;
  extra_subtypes: GlowUpSubtype[] | null;
  city: 'seoul' | 'busan';
  region: GlowUpPlace['region'];
  address_en: string | null;
  address_ko: string | null;
  lat: number | null;
  lng: number | null;
  coord_approx: boolean;
  rating: number | null;
  review_count: number | null;
  languages: GlowUpLanguage[] | null;
  korean_only_staff: boolean;
  english_support: boolean | null;
  subway: string | null;
  hours: string | null;
  price_from_usd: number | null;
  minutes: number | null;
  downtime: GlowUpDowntime | null;
  downtime_note: string | null;
  before_you_book: string[] | null;
  reservation_confirm: string | null;
  highlights: string[] | null;
}

interface ProductRow {
  place_id: string;
  position: number;
  name: string;
  price_usd: number | null;
  original_price_usd: number | null;
}

function fromRow(row: PlaceRow, products: GlowUpProduct[]): GlowUpPlace {
  return withUrl({
    id: row.id,
    name: row.name,
    branch: row.branch,
    tagline: row.tagline,
    subtype: row.subtype,
    extraSubtypes: row.extra_subtypes ?? [],
    city: row.city,
    region: row.region,
    addressEn: row.address_en,
    addressKo: row.address_ko,
    lat: row.lat,
    lng: row.lng,
    coordApprox: row.coord_approx,
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: row.review_count,
    languages: row.languages ?? [],
    koreanOnlyStaff: row.korean_only_staff,
    englishSupport: row.english_support,
    subway: row.subway,
    hours: row.hours,
    products,
    priceFromUsd: row.price_from_usd == null ? null : Number(row.price_from_usd),
    minutes: row.minutes,
    downtime: row.downtime,
    downtimeNote: row.downtime_note,
    beforeYouBook: row.before_you_book ?? [],
    reservationConfirm: row.reservation_confirm,
    highlights: row.highlights ?? [],
  });
}

async function fetchFromSupabase(): Promise<GlowUpPlace[]> {
  if (!supabase) return [];
  const [placesRes, productsRes] = await Promise.all([
    supabase.from('places').select('*'),
    supabase.from('place_products').select('place_id, position, name, price_usd, original_price_usd').order('position'),
  ]);
  if (placesRes.error || !placesRes.data) return [];

  const byPlace = new Map<string, GlowUpProduct[]>();
  for (const p of (productsRes.data ?? []) as ProductRow[]) {
    const list = byPlace.get(p.place_id) ?? [];
    list.push({
      name: p.name,
      priceUsd: p.price_usd == null ? null : Number(p.price_usd),
      originalPriceUsd: p.original_price_usd == null ? null : Number(p.original_price_usd),
    });
    byPlace.set(p.place_id, list);
  }
  return (placesRes.data as PlaceRow[]).map((row) => fromRow(row, byPlace.get(row.id) ?? []));
}

let cache: Promise<GlowUpPlace[]> | null = null;

/** Places for the Glow Up result: Supabase `places` when it has rows, otherwise the bundled
 * seed (src/data/glowUpPlaces.json). Memoized for the session. */
export function loadGlowUpPlaces(): Promise<GlowUpPlace[]> {
  cache ??= (async () => {
    try {
      const remote = await fetchFromSupabase();
      if (remote.length > 0) return remote;
    } catch {
      // fall through to the bundled seed
    }
    return (bundled as PlaceInput[]).map(withUrl);
  })();
  return cache;
}

export async function getGlowUpPlace(id: string): Promise<GlowUpPlace | undefined> {
  return (await loadGlowUpPlaces()).find((p) => p.id === id);
}
