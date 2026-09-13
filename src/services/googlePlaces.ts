import { isEnglishText, toEnglishAddress, type AddressComponent } from '../lib/englishAddress';

export type ApiHealth = { kto: boolean; google: boolean };

export interface GooglePlaceHit {
  id: string;
  name: string;
  address: string;
  addressComponents?: AddressComponent[];
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  priceLevel?: string;
  types: string[];
  primaryType?: string;
  photoName?: string;
  phone?: string;
  website?: string;
}

export interface GooglePlaceReview {
  text: string;
  rating: number;
  languageCode?: string;
}

export interface GooglePlaceDetails {
  id: string;
  name: string;
  address: string;
  addressComponents?: AddressComponent[];
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  types: string[];
  primaryType?: string;
  editorialSummary?: string;
  reviews: GooglePlaceReview[];
}

interface PlacesSearchResponse {
  places?: Array<PlacePayload>;
  error?: { message?: string; status?: string };
}

interface PlacePayload {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  primaryType?: string;
  photos?: Array<{ name?: string }>;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  editorialSummary?: { text?: string; languageCode?: string };
  reviews?: Array<{
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
  }>;
  error?: { message?: string; status?: string };
}

export function placesPhotoUrl(photoName: string): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}&maxHeightPx=800`;
}

function mapHit(place: PlacePayload): GooglePlaceHit | null {
  if (!place.id || !place.displayName?.text) return null;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (lat == null || lng == null) return null;
  return {
    id: place.id,
    name: place.displayName.text,
    address: toEnglishAddress(place.formattedAddress, { components: place.addressComponents }),
    addressComponents: place.addressComponents,
    latitude: lat,
    longitude: lng,
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    priceLevel: place.priceLevel,
    types: place.types ?? [],
    primaryType: place.primaryType,
    photoName: place.photos?.[0]?.name,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
  };
}

function pickEnglishReviewText(review: NonNullable<PlacePayload['reviews']>[number]): string {
  const candidates = [review.text, review.originalText];
  for (const candidate of candidates) {
    const text = candidate?.text?.trim() ?? '';
    const lang = (candidate?.languageCode ?? '').toLowerCase();
    if (!text) continue;
    if (lang.startsWith('en') || isEnglishText(text)) return text;
  }
  return '';
}

function mapDetails(place: PlacePayload): GooglePlaceDetails | null {
  if (!place.id || !place.displayName?.text) return null;
  const editorial = place.editorialSummary?.text?.trim() ?? '';
  const editorialLang = (place.editorialSummary?.languageCode ?? '').toLowerCase();
  const editorialOk =
    editorial && (editorialLang.startsWith('en') || (!editorialLang && !/[\uAC00-\uD7A3]/.test(editorial)))
      ? editorial
      : undefined;

  return {
    id: place.id,
    name: place.displayName.text,
    address: toEnglishAddress(place.formattedAddress, { components: place.addressComponents }),
    addressComponents: place.addressComponents,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    types: place.types ?? [],
    primaryType: place.primaryType,
    editorialSummary: editorialOk,
    reviews: (place.reviews ?? [])
      .map((review) => ({
        text: pickEnglishReviewText(review),
        rating: review.rating ?? 0,
        languageCode: review.text?.languageCode,
      }))
      .filter((review) => review.text),
  };
}

async function search(body: Record<string, unknown>): Promise<GooglePlaceHit[]> {
  const response = await fetch('/api/places/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 503) return [];
  const data = (await response.json()) as PlacesSearchResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Places search failed (${response.status})`);
  }
  return (data.places ?? []).map(mapHit).filter((hit): hit is GooglePlaceHit => hit !== null);
}

export async function searchNearby(opts: {
  includedTypes: string[];
  origin: { lat: number; lng: number };
  radiusM?: number;
  maxResultCount?: number;
}): Promise<GooglePlaceHit[]> {
  return search({
    mode: 'nearby',
    includedTypes: opts.includedTypes,
    maxResultCount: Math.min(opts.maxResultCount ?? 20, 20),
    rankPreference: 'POPULARITY',
    languageCode: 'en',
    regionCode: 'KR',
    locationRestriction: {
      circle: {
        center: { latitude: opts.origin.lat, longitude: opts.origin.lng },
        radius: opts.radiusM ?? 5000,
      },
    },
  });
}

export async function searchText(opts: {
  textQuery: string;
  includedType?: string;
  origin: { lat: number; lng: number };
  radiusM?: number;
  maxResultCount?: number;
}): Promise<GooglePlaceHit[]> {
  return search({
    mode: 'text',
    textQuery: opts.textQuery,
    includedType: opts.includedType,
    languageCode: 'en',
    regionCode: 'KR',
    maxResultCount: Math.min(opts.maxResultCount ?? 15, 20),
    locationBias: {
      circle: {
        center: { latitude: opts.origin.lat, longitude: opts.origin.lng },
        radius: opts.radiusM ?? 6000,
      },
    },
  });
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const response = await fetch(`/api/places/details?id=${encodeURIComponent(placeId)}`);
    if (response.status === 503) return null;
    const data = (await response.json()) as PlacePayload;
    if (!response.ok) {
      console.warn('Places details failed', data.error?.message || response.status);
      return null;
    }
    return mapDetails(data);
  } catch (err) {
    console.warn('Places details failed', err);
    return null;
  }
}

let healthCache: ApiHealth | null = null;

export async function getApiHealth(): Promise<ApiHealth> {
  if (healthCache) return healthCache;
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      healthCache = { kto: false, google: false };
      return healthCache;
    }
    const data = (await response.json()) as Partial<ApiHealth>;
    healthCache = { kto: Boolean(data.kto), google: Boolean(data.google) };
    return healthCache;
  } catch (err) {
    console.warn('getApiHealth: /api/health request failed, treating all APIs as unhealthy', err);
    healthCache = { kto: false, google: false };
    return healthCache;
  }
}
