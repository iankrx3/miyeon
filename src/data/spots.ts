import type { BeautyCategory, Place, Spot, SpotArea, SpotSubcategory } from '../types';
import { supabase } from '../lib/supabase';

const IMG = {
  studio: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
  clinic: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200',
  hair: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1200',
  spa: 'https://images.unsplash.com/photo-1544161515-4ac6ee4e8db4?q=80&w=1200',
  nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200',
  makeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200',
  portrait: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200',
  glasses: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=1200',
  wax: 'https://images.unsplash.com/photo-1519415518779-31f12acd77aa?q=80&w=1200',
  brow: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1200',
  shop: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200',
};

const SUBCATEGORY_IMAGE: Record<SpotSubcategory, string> = {
  'color-perm': IMG.hair,
  'head-spa': IMG.spa,
  'hair-makeup': IMG.makeup,
  'hair-extensions': IMG.hair,
  'color-analysis': IMG.studio,
  'beauty-makeup': IMG.makeup,
  'nail-art': IMG.nails,
  'permanent-makeup': IMG.brow,
  waxing: IMG.wax,
  glasses: IMG.glasses,
  'id-portrait': IMG.portrait,
  aesthetics: IMG.spa,
  'skin-care': IMG.clinic,
  shopping: IMG.shop,
};

// Rough fallbacks for the real Creatrip listings (supabase/seed_spots.sql) whose
// scrape didn't expose a price table or venue hours — only unrelated Creatrip
// Buddy concierge-service boilerplate was there. Keeps the itinerary engine's
// arithmetic (budget filtering, block timing) sane instead of showing "$0" or
// stacking every block at 0 minutes.
const DEFAULT_PRICE_RANGE: Record<SpotSubcategory, [number, number]> = {
  'color-perm': [80, 200],
  'head-spa': [60, 120],
  'hair-makeup': [60, 130],
  'hair-extensions': [100, 300],
  'color-analysis': [60, 150],
  'beauty-makeup': [50, 120],
  'nail-art': [30, 70],
  'permanent-makeup': [120, 250],
  waxing: [30, 80],
  glasses: [80, 200],
  'id-portrait': [25, 60],
  aesthetics: [50, 150],
  'skin-care': [100, 300],
  shopping: [15, 80],
};

const DEFAULT_DURATION_MIN: Record<SpotSubcategory, number> = {
  'color-perm': 120,
  'head-spa': 90,
  'hair-makeup': 75,
  'hair-extensions': 180,
  'color-analysis': 60,
  'beauty-makeup': 75,
  'nail-art': 60,
  'permanent-makeup': 90,
  waxing: 45,
  glasses: 45,
  'id-portrait': 40,
  aesthetics: 60,
  'skin-care': 60,
  shopping: 30,
};

const AREA_CENTROID: Record<SpotArea, { lat: number; lng: number }> = {
  Gangnam: { lat: 37.4979, lng: 127.0276 },
  Seongsu: { lat: 37.5446, lng: 127.0559 },
  Hongdae: { lat: 37.5563, lng: 126.9238 },
  Myeongdong: { lat: 37.5636, lng: 126.985 },
};

/** Maps a `spots` table row (supabase/spots_schema.sql) to the app's Spot shape.
 * Returns null for rows with no `area` — every feature here (itinerary days, the
 * map, area filters) is organized around the 4-neighborhood SpotArea enum, so a
 * spot outside it isn't placeable yet (a few real Creatrip listings sit outside
 * Seoul's core tourist neighborhoods; see supabase/seed_spots.sql's notes). The
 * remaining nullable columns get a reasonable per-subcategory/area default
 * rather than being dropped, since most real listings are missing at least one
 * of price/hours/duration in the source scrape. */
function mapSpot(row: any): Spot | null {
  const area = row.area as SpotArea | null;
  if (!area) return null;
  const subcategory = row.subcategory as SpotSubcategory;
  const centroid = AREA_CENTROID[area];
  const [defaultMin, defaultMax] = DEFAULT_PRICE_RANGE[subcategory] ?? [50, 150];

  return {
    id: row.id,
    name: row.name,
    parentCategory: row.parent_category,
    subcategory,
    description: row.description ?? '',
    area,
    address: row.address ?? `${area}, Seoul`,
    latitude: row.latitude ?? centroid.lat,
    longitude: row.longitude ?? centroid.lng,
    priceMin: row.price_min ?? defaultMin,
    priceMax: row.price_max ?? Math.max(row.price_min ?? defaultMax, defaultMax),
    durationMin: row.duration_min ?? DEFAULT_DURATION_MIN[subcategory] ?? 60,
    openingHours: row.opening_hours ?? 'Hours vary — check on booking',
    bookingRequired: Boolean(row.booking_required),
    bookingUrl: row.booking_url ?? undefined,
    languages: row.languages ?? [],
    downtime: row.downtime,
    procedureIntensity: row.procedure_intensity,
    needleRequired: Boolean(row.needle_required),
    touristFriendly: Boolean(row.tourist_friendly),
    factoryLike: Boolean(row.factory_like),
    upsellingRisk: Boolean(row.upselling_risk),
    priceTransparency: Boolean(row.price_transparency),
    images: row.images?.length ? row.images : [SUBCATEGORY_IMAGE[subcategory]],
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    experienceStyle: row.experience_style,
    googlePlaceId: row.google_place_id ?? undefined,
  };
}

let cachedSpots: Spot[] = [];
let loadPromise: Promise<Spot[]> | null = null;

/** Loads the real `spots` table from Supabase into an in-memory cache, once.
 * getSpot()/getSpots() stay synchronous — they have many callers (incl. the
 * itinerary generator in services/itinerary/generate.ts) that aren't async —
 * and just read this cache. App.tsx awaits this once at bootstrap, before any
 * route that reads spots can mount. */
export function loadSpots(): Promise<Spot[]> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    if (!supabase) return cachedSpots;
    try {
      const { data, error } = await supabase.from('spots').select('*');
      if (error) throw error;
      cachedSpots = (data ?? []).map(mapSpot).filter((s): s is Spot => s !== null);
    } catch (err) {
      console.warn('loadSpots: Supabase query failed', err);
    }
    return cachedSpots;
  })();
  return loadPromise;
}

export function getSpot(id: string): Spot | undefined {
  return cachedSpots.find((s) => s.id === id);
}

export function getSpots(): Spot[] {
  return cachedSpots;
}

export const SUBCATEGORY_LABEL: Record<SpotSubcategory, string> = {
  'color-perm': 'Color & Perm',
  'head-spa': 'Head Spa & Treatment',
  'hair-makeup': 'Hair & Makeup',
  'hair-extensions': 'Hair Extensions',
  'color-analysis': 'Color Analysis',
  'beauty-makeup': 'Beauty Makeup',
  'nail-art': 'Nail Art',
  'permanent-makeup': 'Permanent Makeup',
  waxing: 'Waxing & Hair Removal',
  glasses: 'Glasses',
  'id-portrait': 'ID & Portrait',
  aesthetics: 'Aesthetics',
  'skin-care': 'Skin Care',
  shopping: 'K-Beauty Shopping',
};

const SUBCATEGORY_BEAUTY: Record<SpotSubcategory, BeautyCategory> = {
  'color-perm': 'hair',
  'head-spa': 'hair',
  'hair-makeup': 'hair',
  'hair-extensions': 'hair',
  'color-analysis': 'makeup',
  'beauty-makeup': 'makeup',
  'nail-art': 'nails',
  'permanent-makeup': 'makeup',
  waxing: 'skin',
  glasses: 'makeup',
  'id-portrait': 'makeup',
  aesthetics: 'skin',
  'skin-care': 'skin',
  shopping: 'makeup',
};

function priceRange(min: number): Place['priceRange'] {
  if (min < 50) return '$';
  if (min < 120) return '$$';
  if (min < 400) return '$$$';
  return '$$$$';
}

export function spotToPlace(spot: Spot): Place {
  return {
    id: spot.id,
    name: spot.name,
    category: SUBCATEGORY_BEAUTY[spot.subcategory],
    address: spot.address,
    area: spot.area,
    latitude: spot.latitude,
    longitude: spot.longitude,
    photoUrl: spot.images[0],
    photos: spot.images,
    priceRange: priceRange(spot.priceMin),
    rating: spot.rating,
    reviewCount: spot.reviewCount,
    representativeTreatment: SUBCATEGORY_LABEL[spot.subcategory],
    treatmentIds: [],
    language: spot.languages,
    foreignerFriendly: spot.touristFriendly,
    bookingUrl: spot.bookingUrl,
    whyPeopleLikeIt: [spot.description],
    source: 'mock',
    googlePlaceId: spot.googlePlaceId,
  };
}

export function allSpotsAsPlaces(): Place[] {
  return getSpots().map(spotToPlace);
}
