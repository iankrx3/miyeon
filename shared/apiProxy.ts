export const KTO_BASE = 'https://apis.data.go.kr/B551011/MdclTursmService';
export const PLACES_BASE = 'https://places.googleapis.com/v1';

export const KTO_OPS = new Set([
  'searchKeyword',
  'locationBasedList',
  'areaBasedList',
  'detailCommon',
  'detailMdclTursm',
  'detailIntro',
  'ldongCode',
]);

export const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.priceLevel',
  'places.types',
  'places.primaryType',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
].join(',');

/** Single-place field mask — Place Details does not use the `places.` prefix. */
export const PLACES_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'rating',
  'userRatingCount',
  'reviews',
  'editorialSummary',
  'types',
  'primaryType',
].join(',');

export function decodeServiceKey(raw: string): string {
  try {
    return raw.includes('%') ? decodeURIComponent(raw) : raw;
  } catch {
    return raw;
  }
}
