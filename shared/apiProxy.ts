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

/** Pro-tier search fields only. rating/phone/website/priceLevel/photos would
 *  bill Nearby/Text Search as Enterprise (1,000 free/month instead of 5,000). */
export const PLACES_SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.location',
  'places.types',
  'places.primaryType',
].join(',');

/** @deprecated Use PLACES_SEARCH_FIELD_MASK — kept so older imports keep compiling. */
export const PLACES_FIELD_MASK = PLACES_SEARCH_FIELD_MASK;

/** Pro-tier Place Details only. reviews/editorialSummary → Enterprise + Atmosphere;
 *  rating/phone/website → Enterprise. Both have a 1,000/month free cap. */
export const PLACES_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
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
