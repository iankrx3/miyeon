import type {
  BeautyTripProfile,
  GlowUpBudget,
  GlowUpLanguage,
  GlowUpRegion,
  GlowUpSubtype,
  SpotSubcategory,
} from '../types';

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

// ---- GLOW UP QUIZ (V2) — additive only. Nothing above this line changes;
// buildCreatripListUrl/CREATRIP_CATEGORY/CREATRIP_THEME/creatripThemesForProfile
// stay exactly as-is for the curator/Itinerary flow (ItineraryTimeline.tsx). ----

/** Creatrip's "Spas & Wellness" category — confirmed live on creatrip.com. Kept
 * separate from CREATRIP_CATEGORY (whose keys are the legacy SpotSubcategory
 * union owned by the curator/Spot pipeline) rather than extending that union. */
const RESTORE_CATEGORY = 3070;

/** Maps every GlowUp leaf item to Creatrip's {category, middleCategory}. `hair`
 * intentionally has no middleCategory: Screen 2 no longer asks a sub-question to
 * disambiguate color-perm/head-spa/hair-makeup/hair-extensions, so linking to the
 * category-level "All Hair Salons" page is honest — guessing one middle category
 * would silently narrow results the user never asked to narrow. */
export const GLOWUP_CATEGORY_MAP: Record<GlowUpSubtype, { category: number; middleCategory?: number }> = {
  skin: { category: 3068, middleCategory: 404 },
  face: { category: 403, middleCategory: 3104 },
  hair: { category: 3028 },
  nail: { category: 403, middleCategory: 886 },
  'personal-color': { category: 403, middleCategory: 926 },
  makeup: { category: 403, middleCategory: 878 },
  'permanent-makeup': { category: 403, middleCategory: 3037 },
  photo: { category: 403, middleCategory: 3082 },
  sauna: { category: RESTORE_CATEGORY, middleCategory: 3085 },
  scrub: { category: RESTORE_CATEGORY, middleCategory: 3083 },
  massage: { category: RESTORE_CATEGORY, middleCategory: 3086 },
  yoga: { category: RESTORE_CATEGORY, middleCategory: 3084 },
};

/** Creatrip's numeric `region` filter id. Confirmed live: Gangnam=8, Hongdae/Mapo=5.
 * TODO verify Myeongdong/Seongsu ids on creatrip.com before shipping — left
 * unmapped rather than guessed. */
export const GLOWUP_REGION_ID: Partial<Record<Exclude<GlowUpRegion, 'auto'>, number>> = {
  gangnam: 8,
  'hongdae-mapo': 5,
};

/** Fallback for "You decide" — Gangnam only because its id is already verified;
 * swap for a real product default once one is chosen. */
const DEFAULT_REGION_ID = GLOWUP_REGION_ID.gangnam!;

export function regionIdForProfile(region: GlowUpRegion | null): number | undefined {
  if (!region || region === 'auto') return DEFAULT_REGION_ID;
  return GLOWUP_REGION_ID[region];
}

/** Creatrip's minPrice/maxPrice are plain USD numbers; the quiz's budget tiers
 * are KRW. Placeholder fixed rate — not live-fetched. */
export const KRW_TO_USD_RATE = 1350;

function krwToUsd(krw: number): number {
  return Math.round(krw / KRW_TO_USD_RATE);
}

export function budgetRangeUsd(budget: GlowUpBudget | null): { min?: number; max?: number } {
  switch (budget) {
    case 'under-100k':
      return { max: krwToUsd(100_000) };
    case '100-300k':
      return { min: krwToUsd(100_000), max: krwToUsd(300_000) };
    case '300-500k':
      return { min: krwToUsd(300_000), max: krwToUsd(500_000) };
    default:
      return {};
  }
}

const GLOWUP_LANGUAGE_THEME: Partial<Record<GlowUpLanguage, number>> = {
  Chinese: CREATRIP_THEME.chinese,
  Japanese: CREATRIP_THEME.japanese,
  Thai: CREATRIP_THEME.thai,
  Vietnamese: CREATRIP_THEME.vietnamese,
  // English: Creatrip exposes this as a separate toolbar toggle, not a `theme=`
  // id — TODO confirm the real param before launch. Omitted for now rather than
  // guessed, so selecting it is UI-only until then.
};

export function themeIdsForLanguages(languages: GlowUpLanguage[]): number[] {
  return languages.map((l) => GLOWUP_LANGUAGE_THEME[l]).filter((id): id is number => id != null);
}

export interface GlowUpUrlContext {
  region: GlowUpRegion | null;
  budget: GlowUpBudget | null;
  languages: GlowUpLanguage[];
}

/** Builds a Creatrip category-list URL for one GlowUp slot item. Region/budget/
 * language are shared across every slot in a result — only category/
 * middleCategory differs per slot. Returns null only if GLOWUP_CATEGORY_MAP is
 * ever missing an entry (shouldn't happen — all 12 subtypes are mapped above). */
export function buildGlowUpCreatripUrl(subtype: GlowUpSubtype, ctx: GlowUpUrlContext): string | null {
  const mapping = GLOWUP_CATEGORY_MAP[subtype];
  if (!mapping) return null;
  const params = new URLSearchParams({
    page: '1',
    category: String(mapping.category),
    order: 'MOST_VIEWED_IN_A_MONTH',
    direction: 'DESC',
  });
  if (mapping.middleCategory != null) params.set('middleCategory', String(mapping.middleCategory));
  const regionId = regionIdForProfile(ctx.region);
  if (regionId != null) params.set('region', String(regionId));
  const { min, max } = budgetRangeUsd(ctx.budget);
  if (min != null) params.set('minPrice', String(min));
  if (max != null) params.set('maxPrice', String(max));
  for (const id of new Set(themeIdsForLanguages(ctx.languages))) params.append('theme', String(id));
  return withCreatripAffiliate(`${CREATRIP_BASE_URL}/spot/list?${params.toString()}`);
}
