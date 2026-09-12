import type { BeautyCategory, MedicalTourismMatch, Place, Treatment } from '../types';
import { categorySearch, resolveOrigin } from '../data/categorySearch';
import { getApiHealth, placesPhotoUrl, searchNearby, searchText, type GooglePlaceHit } from './googlePlaces';
import { detailMedical, locationBasedList, searchKeyword, type KtoFacility } from './kto';

export interface DiscoverQuery {
  category: BeautyCategory;
  origin?: { lat: number; lng: number };
  radiusM?: number;
  keywordHints?: string[];
  englishFriendly?: boolean;
  limit?: number;
}

export interface DiscoveryResult {
  places: Place[];
  treatments: Treatment[];
}

interface Catalog {
  places: Map<string, Place>;
  treatments: Map<string, Treatment>;
}

const catalog: Catalog = { places: new Map(), treatments: new Map() };
const cache = new Map<string, { expires: number; result: DiscoveryResult }>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MATCH_DISTANCE_M = 150;

const PRICE_FROM_LEVEL: Record<string, Place['priceRange']> = {
  PRICE_LEVEL_FREE: '$',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

export const PRICE_BAND: Record<Place['priceRange'], { min: number; max: number }> = {
  $: { min: 40, max: 90 },
  $$: { min: 80, max: 180 },
  $$$: { min: 150, max: 350 },
  $$$$: { min: 300, max: 700 },
};

export function rememberDiscovery(result: DiscoveryResult) {
  for (const place of result.places) catalog.places.set(place.id, place);
  for (const treatment of result.treatments) catalog.treatments.set(treatment.id, treatment);
}

export function catalogPlace(id: string): Place | undefined {
  return catalog.places.get(id);
}

export function catalogTreatment(id: string): Treatment | undefined {
  return catalog.treatments.get(id);
}

export function catalogPlaces(): Place[] {
  return [...catalog.places.values()];
}

export function catalogTreatments(): Treatment[] {
  return [...catalog.treatments.values()];
}

function cacheKey(query: DiscoverQuery, origin: { lat: number; lng: number }): string {
  const hints = (query.keywordHints ?? []).slice().sort().join(',');
  return [query.category, origin.lat.toFixed(3), origin.lng.toFixed(3), query.radiusM ?? 5000, hints].join('|');
}

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(clinic|hospital|dermatology|derma|salon|studio|spa|의원|병원|클리닉|피부과|성형외과|헤어|네일|메이크업)\b/g, ' ')
    .replace(/[^a-z0-9가-힣]+/g, ' ')
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(' ').filter((t) => t.length > 1));
  const tb = new Set(nb.split(' ').filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const token of ta) if (tb.has(token)) overlap += 1;
  return overlap / Math.min(ta.size, tb.size) >= 0.6;
}

function areaFromAddress(address: string): string {
  const guLatin = address.match(/([A-Za-z]+)-gu/i);
  if (guLatin) return guLatin[1];
  const guKr = address.match(/(\S+구)/);
  if (guKr) return guKr[1].replace(/구$/, '');
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'Seoul';
}

function hasEnglish(languages: string[]): boolean {
  return languages.some((lang) => /english|영어|eng/i.test(lang));
}

function googlePriceRange(level?: string): Place['priceRange'] {
  if (!level) return '$$';
  return PRICE_FROM_LEVEL[level] ?? '$$';
}

function samePlace(
  google: GooglePlaceHit,
  kto: KtoFacility
): boolean {
  if (!kto.latitude || !kto.longitude) return namesMatch(google.name, kto.title);
  const dist = distanceM(
    { lat: google.latitude, lng: google.longitude },
    { lat: kto.latitude, lng: kto.longitude }
  );
  if (dist > MATCH_DISTANCE_M) return false;
  return namesMatch(google.name, kto.title) || dist < 80;
}

async function fetchGoogle(query: DiscoverQuery, origin: { lat: number; lng: number }): Promise<GooglePlaceHit[]> {
  const spec = categorySearch[query.category];
  const radiusM = query.radiusM ?? 5000;
  const nearby = searchNearby({
    includedTypes: spec.googleTypes,
    origin,
    radiusM,
    maxResultCount: 20,
  })
    .catch(() =>
      searchNearby({
        includedTypes: spec.googleTypes.slice(0, 1),
        origin,
        radiusM,
        maxResultCount: 20,
      })
    )
    .catch((err) => {
      console.warn('Google Nearby failed', err);
      return [] as GooglePlaceHit[];
    });

  const hint = (query.keywordHints ?? []).slice(0, 2).join(' ');
  const textQuery = hint ? `${hint} ${spec.textQuery}` : spec.textQuery;
  const text = searchText({
    textQuery,
    includedType: spec.googleTypes[0],
    origin,
    radiusM: radiusM + 1000,
    maxResultCount: 12,
  }).catch((err) => {
    console.warn('Google Text Search failed', err);
    return [] as GooglePlaceHit[];
  });

  const [nearbyHits, textHits] = await Promise.all([nearby, text]);
  const seen = new Set<string>();
  const merged: GooglePlaceHit[] = [];
  for (const hit of [...nearbyHits, ...textHits]) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    merged.push(hit);
  }
  return merged;
}

async function fetchKto(query: DiscoverQuery, origin: { lat: number; lng: number }): Promise<KtoFacility[]> {
  const spec = categorySearch[query.category];
  if (spec.ktoKeywords.length === 0) return [];
  const radiusM = Math.min(query.radiusM ?? 8000, 20000);
  const around = locationBasedList(origin, radiusM).catch((err) => {
    console.warn('KTO locationBasedList failed', err);
    return [] as KtoFacility[];
  });
  const keyword = spec.ktoKeywords[0];
  const byKeyword = searchKeyword(keyword, { numOfRows: 20, regionCode: '11' }).catch((err) => {
    console.warn('KTO searchKeyword failed', err);
    return [] as KtoFacility[];
  });
  const [a, b] = await Promise.all([around, byKeyword]);
  const seen = new Set<string>();
  const merged: KtoFacility[] = [];
  for (const item of [...a, ...b]) {
    if (seen.has(item.contentId)) continue;
    seen.add(item.contentId);
    merged.push(item);
  }
  return merged;
}

function filterKtoForCategory(items: KtoFacility[], category: BeautyCategory): KtoFacility[] {
  const keywords = categorySearch[category].ktoKeywords;
  if (keywords.length === 0) return [];
  const pattern = new RegExp(keywords.join('|'), 'i');
  const matched = items.filter((item) => pattern.test(item.title) || pattern.test(item.address));
  return matched.length > 0 ? matched : items;
}

async function enrichKtoMatches(places: Place[]): Promise<void> {
  const pending = places.filter((place) => place.ktoContentId && place.medicalTourismMatch);
  const top = pending.slice(0, 5);
  await Promise.all(
    top.map(async (place) => {
      try {
        const detail = await detailMedical(place.ktoContentId!);
        if (!detail || !place.medicalTourismMatch) return;
        if (detail.departments.length) place.medicalTourismMatch.departments = detail.departments;
        if (detail.languages.length) {
          place.medicalTourismMatch.supportedLanguages = detail.languages;
          place.language = detail.languages;
          place.foreignerFriendly = hasEnglish(detail.languages) || place.foreignerFriendly;
        }
      } catch (err) {
        console.warn('KTO detailMdclTursm failed', err);
      }
    })
  );
}

function toPlaceFromGoogle(
  hit: GooglePlaceHit,
  category: BeautyCategory,
  kto?: KtoFacility,
  englishFriendly?: boolean
): Place {
  const spec = categorySearch[category];
  const match: MedicalTourismMatch | undefined = kto
    ? {
        orgName: kto.title,
        address: kto.address || hit.address,
        departments: [],
        supportedLanguages: [],
        contact: kto.tel,
        registered: true,
      }
    : undefined;
  const priceRange = googlePriceRange(hit.priceLevel);
  const treatmentId = `t-gp_${hit.id}`;
  return {
    id: `gp_${hit.id}`,
    name: hit.name,
    category,
    address: hit.address,
    area: areaFromAddress(hit.address),
    latitude: hit.latitude,
    longitude: hit.longitude,
    photoUrl: hit.photoName ? placesPhotoUrl(hit.photoName) : spec.fallbackPhoto,
    priceRange,
    rating: hit.rating || 0,
    reviewCount: hit.reviewCount,
    representativeTreatment: spec.representativeTreatment,
    treatmentIds: [treatmentId],
    language: ['Korean'],
    foreignerFriendly: Boolean(englishFriendly && hit.rating >= 4.3) || Boolean(kto),
    aiPick: hit.rating >= 4.6,
    bookingUrl: hit.website,
    medicalTourismMatch: match,
    source: kto ? 'merged' : 'google',
    googlePlaceId: hit.id,
    ktoContentId: kto?.contentId,
  };
}

function toPlaceFromKto(item: KtoFacility, category: BeautyCategory): Place {
  const spec = categorySearch[category];
  const treatmentId = `t-kto_${item.contentId}`;
  return {
    id: `kto_${item.contentId}`,
    name: item.title,
    category,
    address: item.address,
    area: areaFromAddress(item.address),
    latitude: item.latitude,
    longitude: item.longitude,
    photoUrl: item.imageUrl || spec.fallbackPhoto,
    priceRange: '$$$',
    rating: 0,
    reviewCount: 0,
    representativeTreatment: spec.representativeTreatment,
    treatmentIds: [treatmentId],
    language: ['Korean'],
    foreignerFriendly: true,
    medicalTourismMatch: {
      orgName: item.title,
      address: item.address,
      departments: [],
      supportedLanguages: [],
      contact: item.tel,
      registered: true,
    },
    source: 'kto',
    ktoContentId: item.contentId,
  };
}

function treatmentForPlace(place: Place, hints: string[] = []): Treatment {
  const spec = categorySearch[place.category];
  const band = PRICE_BAND[place.priceRange] ?? spec.defaultPrice;
  return {
    id: place.treatmentIds[0] || `t-${place.id}`,
    name: place.representativeTreatment,
    category: place.category,
    concern: hints.length ? hints : [spec.representativeTreatment],
    expectedResult: spec.representativeTreatment,
    downtime: place.category === 'face' ? '1-3-days' : 'none',
    resultTiming: place.category === 'skin' || place.category === 'face' ? 'within-week' : 'asap',
    price: { min: band.min, max: band.max, currency: 'USD' },
    treatmentType: spec.representativeTreatment,
    intensity: place.category === 'face' ? 'high' : place.category === 'skin' ? 'medium' : 'low',
    placeId: place.id,
    language: place.language,
    foreignerFriendliness: place.foreignerFriendly ? 0.9 : 0.65,
    reviewCount: place.reviewCount,
    rating: place.rating || 4.4,
    creatripAvailable: false,
  };
}

export async function discoverPlaces(query: DiscoverQuery): Promise<DiscoveryResult> {
  const origin = resolveOrigin(query.origin);
  const key = cacheKey(query, origin);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;

  const health = await getApiHealth();
  if (!health.google && !health.kto) {
    return { places: [], treatments: [] };
  }

  const googlePromise = health.google ? fetchGoogle(query, origin) : Promise.resolve([] as GooglePlaceHit[]);
  const ktoPromise = health.kto ? fetchKto(query, origin) : Promise.resolve([] as KtoFacility[]);
  const [googleHits, ktoRaw] = await Promise.all([googlePromise, ktoPromise]);
  const ktoHits = filterKtoForCategory(ktoRaw, query.category);

  const usedKto = new Set<string>();
  const places: Place[] = [];

  for (const hit of googleHits) {
    const match = ktoHits.find((item) => !usedKto.has(item.contentId) && samePlace(hit, item));
    if (match) usedKto.add(match.contentId);
    places.push(toPlaceFromGoogle(hit, query.category, match, query.englishFriendly));
  }

  for (const item of ktoHits) {
    if (usedKto.has(item.contentId)) continue;
    if (!item.latitude || !item.longitude) continue;
    places.push(toPlaceFromKto(item, query.category));
  }

  await enrichKtoMatches(places);

  const limited = places.slice(0, query.limit ?? 24);
  const treatments = limited.map((place) => treatmentForPlace(place, query.keywordHints));
  const result = { places: limited, treatments };
  rememberDiscovery(result);
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
  return result;
}

/**
 * Live, as-you-type search (Map tab search box): finds real Google Places
 * matching free text, constrained to the given categories' place types so
 * e.g. a hair salon can't surface while searching the skin/face-only map.
 * Unlike discoverPlaces(), this skips the "nearby" leg (irrelevant for a
 * specific text query) and KTO merging (keeps it fast for type-ahead).
 */
export async function searchPlacesByCategory(
  categories: BeautyCategory[],
  query: string,
  origin?: { lat: number; lng: number }
): Promise<Place[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const health = await getApiHealth();
  if (!health.google) return [];

  const resolvedOrigin = resolveOrigin(origin);

  const perCategory = await Promise.all(
    categories.map(async (category) => {
      const spec = categorySearch[category];
      try {
        const hits = await searchText({
          textQuery: `${trimmed} Seoul`,
          includedType: spec.googleTypes[0],
          origin: resolvedOrigin,
          maxResultCount: 8,
        });
        return hits.map((hit) => toPlaceFromGoogle(hit, category));
      } catch (err) {
        console.warn(`searchPlacesByCategory(${category}) failed`, err);
        return [] as Place[];
      }
    })
  );

  const seen = new Set<string>();
  const merged: Place[] = [];
  for (const place of perCategory.flat()) {
    if (seen.has(place.id)) continue;
    seen.add(place.id);
    merged.push(place);
  }

  // So a later fetchPlaceById(id) (e.g. clicking through to /place/:id) can
  // resolve these — same pattern discoverPlaces() uses for its results.
  rememberDiscovery({ places: merged, treatments: merged.map((place) => treatmentForPlace(place)) });

  return merged;
}

const ALL_CATEGORIES: BeautyCategory[] = ['skin', 'face', 'hair', 'nails', 'makeup'];

export async function discoverAll(origin?: { lat: number; lng: number }): Promise<DiscoveryResult> {
  const results = await Promise.all(
    ALL_CATEGORIES.map((category) =>
      discoverPlaces({ category, origin, limit: 12 }).catch((err) => {
        console.warn(`discoverPlaces(${category}) failed`, err);
        return { places: [], treatments: [] } satisfies DiscoveryResult;
      })
    )
  );
  const places: Place[] = [];
  const treatments: Treatment[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    for (const place of result.places) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(place);
    }
    treatments.push(...result.treatments);
  }
  const merged = { places, treatments };
  rememberDiscovery(merged);
  return merged;
}


