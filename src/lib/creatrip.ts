import type { BeautyTripProfile, SpotSubcategory } from '../types';

const CREATRIP_AFF_PARAMS = { utm_source: 'AFF-e2873zu', aff_id: 'AFF-e2873zu' };

export const CREATRIP_BASE_URL = 'https://creatrip.com/en';

export const CREATRIP_DISCLOSURE =
  'Booking through this link may earn Miyeon a small commission — at no extra cost to you.';

/** Appends the Creatrip affiliate tracking params to any creatrip.com URL. */
export function withCreatripAffiliate(url: string): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', CREATRIP_AFF_PARAMS.utm_source);
  u.searchParams.set('aff_id', CREATRIP_AFF_PARAMS.aff_id);
  return u.toString();
}

/** True when bookingUrl points at a specific Creatrip listing, not just the generic homepage. */
export function hasCreatripListing(place: { bookingUrl?: string }): boolean {
  if (!place.bookingUrl) return false;
  try {
    const u = new URL(place.bookingUrl);
    return u.hostname.endsWith('creatrip.com') && u.pathname.replace(/\/+$/, '') !== '/en';
  } catch {
    return false;
  }
}

/** Creatrip's real category (large) + middleCategory (specific) ids for its beauty
 * verticals, per creatrip.com/en/spot/list. 'shopping' has no Creatrip equivalent and
 * is intentionally absent — callers must handle a missing mapping. */
export const CREATRIP_CATEGORY: Partial<Record<SpotSubcategory, { category: number; middleCategory: number }>> = {
  'color-perm': { category: 3028, middleCategory: 3029 },
  'head-spa': { category: 3028, middleCategory: 3030 },
  'hair-makeup': { category: 3028, middleCategory: 3031 },
  'hair-extensions': { category: 3028, middleCategory: 3034 },
  'color-analysis': { category: 403, middleCategory: 926 },
  'beauty-makeup': { category: 403, middleCategory: 878 },
  'nail-art': { category: 403, middleCategory: 886 },
  'permanent-makeup': { category: 403, middleCategory: 3037 },
  waxing: { category: 403, middleCategory: 3060 },
  glasses: { category: 403, middleCategory: 3077 },
  'id-portrait': { category: 403, middleCategory: 3082 },
  aesthetics: { category: 403, middleCategory: 3104 },
  'skin-care': { category: 3068, middleCategory: 404 },
};

/** Creatrip's `theme` filter ids we have real profile signal for. "With a partner" /
 * "Solo travel" / "Reservation confirmation speed" have no matching profile field, so
 * they're intentionally not wired up rather than guessed. */
export const CREATRIP_THEME = {
  affordablePrice: 14,
  excellentService: 16,
  chinese: 4,
  japanese: 6,
  thai: 7,
  vietnamese: 8,
} as const;

/** Builds a Creatrip category-list URL (with affiliate params) for a given
 * subcategory, e.g. https://creatrip.com/en/spot/list?...&middleCategory=886&theme=14.
 * Returns null when the subcategory has no Creatrip equivalent (only 'shopping' today). */
export function buildCreatripListUrl(subcategory: SpotSubcategory, themeIds: number[] = []): string | null {
  const mapping = CREATRIP_CATEGORY[subcategory];
  if (!mapping) return null;
  const params = new URLSearchParams({
    page: '1',
    category: String(mapping.category),
    order: 'MOST_VIEWED_IN_A_MONTH',
    direction: 'DESC',
    middleCategory: String(mapping.middleCategory),
  });
  for (const id of new Set(themeIds)) params.append('theme', String(id));
  return withCreatripAffiliate(`${CREATRIP_BASE_URL}/spot/list?${params.toString()}`);
}

const LANGUAGE_THEME: Record<string, number> = {
  Chinese: CREATRIP_THEME.chinese,
  Japanese: CREATRIP_THEME.japanese,
  Thai: CREATRIP_THEME.thai,
  Vietnamese: CREATRIP_THEME.vietnamese,
};

/** Derives Creatrip `theme` filter ids from the parts of BeautyTripProfile that have a
 * real match — language needs, budget tier, and the restrictions that no longer hard-
 * filter live spots (src/services/itinerary/generate.ts) but still express real intent. */
export function creatripThemesForProfile(profile?: BeautyTripProfile | null): number[] {
  if (!profile) return [];
  const themes = new Set<number>();
  for (const lang of profile.languageNeeds ?? []) {
    const id = LANGUAGE_THEME[lang];
    if (id) themes.add(id);
  }
  if (profile.budget === 'under-100' || profile.restrictions.includes('no-surprise-costs')) {
    themes.add(CREATRIP_THEME.affordablePrice);
  }
  if (profile.restrictions.includes('no-upsell') || profile.restrictions.includes('no-factory')) {
    themes.add(CREATRIP_THEME.excellentService);
  }
  return [...themes];
}
