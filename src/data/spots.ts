import type { BeautyCategory, Place, Spot, SpotArea, SpotParentCategory, SpotSubcategory } from '../types';
import { discoverAll, PRICE_BAND } from '../services/discovery';

const SUBCATEGORY_IMAGE: Record<SpotSubcategory, string> = {
  'color-perm': 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1200',
  'head-spa': 'https://images.unsplash.com/photo-1544161515-4ac6ee4e8db4?q=80&w=1200',
  'hair-makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200',
  'hair-extensions': 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1200',
  'color-analysis': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
  'beauty-makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200',
  'nail-art': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200',
  'permanent-makeup': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1200',
  waxing: 'https://images.unsplash.com/photo-1519415518779-31f12acd77aa?q=80&w=1200',
  glasses: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=1200',
  'id-portrait': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200',
  aesthetics: 'https://images.unsplash.com/photo-1544161515-4ac6ee4e8db4?q=80&w=1200',
  'skin-care': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200',
  shopping: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200',
};

/** Coarse stand-in used only where the itinerary engine/UI need a SpotSubcategory/
 * SpotParentCategory label (e.g. ItineraryTimeline's category chip). Google/KTO only
 * tell us the broad BeautyCategory (5 values), never the 14-way curated subcategory,
 * so each category maps to a single representative subcategory rather than the real
 * service breakdown a hand-curated listing would have. */
const CATEGORY_TO_SUBCATEGORY: Record<BeautyCategory, { parentCategory: SpotParentCategory; subcategory: SpotSubcategory }> = {
  skin: { parentCategory: 'dermatology', subcategory: 'skin-care' },
  face: { parentCategory: 'dermatology', subcategory: 'aesthetics' },
  hair: { parentCategory: 'hair-salon', subcategory: 'color-perm' },
  nails: { parentCategory: 'k-beauty', subcategory: 'nail-art' },
  makeup: { parentCategory: 'k-beauty', subcategory: 'beauty-makeup' },
};

const SUBCATEGORY_TO_CATEGORY: Partial<Record<SpotSubcategory, BeautyCategory>> = Object.fromEntries(
  (Object.keys(CATEGORY_TO_SUBCATEGORY) as BeautyCategory[]).map((category) => [
    CATEGORY_TO_SUBCATEGORY[category].subcategory,
    category,
  ])
);

/** Rough per-category appointment length. Google/KTO never report this, so the
 * itinerary engine's day-timing math needs *some* default to schedule blocks with. */
const DEFAULT_DURATION_BY_CATEGORY: Record<BeautyCategory, number> = {
  skin: 60,
  face: 90,
  hair: 120,
  nails: 60,
  makeup: 75,
};

const AREA_CENTROID: Record<SpotArea, { lat: number; lng: number }> = {
  Gangnam: { lat: 37.4979, lng: 127.0276 },
  Seongsu: { lat: 37.5446, lng: 127.0559 },
  Hongdae: { lat: 37.5563, lng: 126.9238 },
  Myeongdong: { lat: 37.5636, lng: 126.985 },
};

const SPOT_AREAS = Object.keys(AREA_CENTROID) as SpotArea[];

/** Buckets a lat/lng into the nearest of the 4 neighborhoods the itinerary engine
 * organizes days around. Google/KTO addresses don't reliably say "Gangnam" etc., so
 * distance-to-centroid is more robust than parsing the address string. */
function nearestArea(lat: number, lng: number): SpotArea {
  let best = SPOT_AREAS[0];
  let bestDist = Infinity;
  for (const area of SPOT_AREAS) {
    const c = AREA_CENTROID[area];
    const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = area;
    }
  }
  return best;
}

/** Maps a live Google Places/KTO Tour API result (src/services/discovery.ts) to the
 * app's Spot shape so the itinerary engine and its UI (ItineraryTimeline,
 * ItineraryRouteMap, SpotSearchPicker, ...) can keep working unchanged. The curated
 * dimensions a hand-seeded listing used to carry — needleRequired, downtime,
 * procedureIntensity, factoryLike, upsellingRisk, priceTransparency, experienceStyle —
 * have no equivalent in either API, so they're fixed to an "always passes" default
 * here; services/itinerary/generate.ts no longer hard-filters or scores on them. */
export function placeToSpot(place: Place): Spot {
  const { parentCategory, subcategory } = CATEGORY_TO_SUBCATEGORY[place.category];
  const band = PRICE_BAND[place.priceRange] ?? PRICE_BAND.$$;

  return {
    id: place.id,
    name: place.name,
    parentCategory,
    subcategory,
    description: place.whyPeopleLikeIt?.[0] ?? '',
    area: nearestArea(place.latitude, place.longitude),
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    priceMin: band.min,
    priceMax: band.max,
    durationMin: DEFAULT_DURATION_BY_CATEGORY[place.category],
    openingHours: 'Hours vary — check listing',
    bookingRequired: false,
    bookingUrl: place.bookingUrl,
    languages: place.language,
    downtime: 'none',
    procedureIntensity: 'medium',
    needleRequired: false,
    touristFriendly: place.foreignerFriendly,
    factoryLike: false,
    upsellingRisk: false,
    priceTransparency: true,
    images: place.photos?.length ? place.photos : [place.photoUrl || SUBCATEGORY_IMAGE[subcategory]],
    rating: place.rating,
    reviewCount: place.reviewCount,
    experienceStyle: 'professional',
    googlePlaceId: place.googlePlaceId,
    source: place.source,
  };
}

let cachedSpots: Spot[] = [];
let loadPromise: Promise<Spot[]> | null = null;

/** Loads itinerary candidates from live Google Places/KTO Tour API discovery into an
 * in-memory cache, once. Queries each of the 4 neighborhood centroids separately (a
 * single Seoul-wide search would skew heavily toward whichever area it's centered on)
 * and merges the results. getSpot()/getSpots() stay synchronous — they have many
 * callers (incl. the itinerary generator in services/itinerary/generate.ts) that
 * aren't async — and just read this cache. App.tsx awaits this once at bootstrap,
 * before any route that reads spots can mount. */
export function loadSpots(): Promise<Spot[]> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const results = await Promise.all(SPOT_AREAS.map((area) => discoverAll(AREA_CENTROID[area])));
      const seen = new Set<string>();
      const merged: Spot[] = [];
      for (const result of results) {
        for (const place of result.places) {
          if (seen.has(place.id)) continue;
          seen.add(place.id);
          merged.push(placeToSpot(place));
        }
      }
      cachedSpots = merged;
    } catch (err) {
      console.warn('loadSpots: live discovery failed', err);
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

function priceRange(min: number): Place['priceRange'] {
  if (min < 50) return '$';
  if (min < 120) return '$$';
  if (min < 400) return '$$$';
  return '$$$$';
}

export function spotToPlace(spot: Spot): Place {
  const category = SUBCATEGORY_TO_CATEGORY[spot.subcategory] ?? 'skin';
  return {
    id: spot.id,
    name: spot.name,
    category,
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
