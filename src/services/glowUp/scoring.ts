import type { GlowUpLanguage, GlowUpMixPreset, GlowUpPlace, GlowUpProfile, GlowUpRegion, GlowUpSubtype } from '../../types';
import { budgetMaxUsdOf } from '../../data/glowUpQuiz';
import { haversineKm, travelForDistance } from '../itinerary/travel';

// Venue choice, step by step: filter (category · link · language · area) → a 0–100 score →
// routine-level combination (fewest cross-town trips) → deterministic tie-break. Same input, same
// result — no randomness anywhere. Google Places "local trust" (15 pts of the spec) isn't wired
// up, so the remaining 85 points are scaled back to 100.

export type AppRegion = Exclude<GlowUpRegion, 'auto'>;

export const REGION_CENTRE: Record<AppRegion, [number, number]> = {
  gangnam: [37.5172, 127.0473],
  'hongdae-mapo': [37.5563, 126.9236],
  myeongdong: [37.5636, 126.9822],
  seongsu: [37.5446, 127.0557],
  seomyeon: [35.1579, 129.0595],
  haeundae: [35.1631, 129.1635],
  gwangalli: [35.1532, 129.1186],
  nampo: [35.098, 129.0324],
};

export const CITY_REGIONS: Record<'seoul' | 'busan', AppRegion[]> = {
  seoul: ['gangnam', 'hongdae-mapo', 'myeongdong', 'seongsu'],
  busan: ['seomyeon', 'haeundae', 'gwangalli', 'nampo'],
};

export const SKIN_GROUP: GlowUpSubtype[] = ['skin', 'face'];

export type LatLng = [number, number];

export const point = (pl: GlowUpPlace): LatLng => [pl.lat ?? 0, pl.lng ?? 0];
export const kmBetween = (a: LatLng, b: LatLng): number =>
  haversineKm({ latitude: a[0], longitude: a[1] }, { latitude: b[0], longitude: b[1] });
export const minutesBetween = (a: LatLng, b: LatLng): number => travelForDistance(kmBetween(a, b)).minutes;

/** Does this venue confirm one of the wanted languages? true / false = confirmed no / null = not stated. */
export function languageFit(place: GlowUpPlace, wanted: GlowUpProfile['languages']): boolean | null {
  const langs: GlowUpLanguage[] = wanted.length > 0 ? wanted : ['English'];
  if (place.languages.some((l) => langs.includes(l))) return true;
  if (langs.includes('English') && place.englishSupport === true) return true;
  if (place.koreanOnlyStaff) return false;
  if (place.languages.length > 0) return false;
  if (langs.includes('English') && place.englishSupport === false) return false;
  return null;
}

/** true = fits, false = known to be over budget, null = price not stated. */
export function budgetFit(place: GlowUpPlace, profile: GlowUpProfile): boolean | null {
  const max = budgetMaxUsdOf(profile);
  if (max == null) return true;
  if (place.priceFromUsd == null) return null;
  return place.priceFromUsd <= max;
}

/** Can this venue serve `subtype`? Skin/face work is clinic work: a salon listing skin care on the side doesn't count. */
export function serves(place: GlowUpPlace, subtype: GlowUpSubtype): boolean {
  if (place.subtype !== subtype && !place.extraSubtypes.includes(subtype)) return false;
  if (SKIN_GROUP.includes(subtype) && !SKIN_GROUP.includes(place.subtype)) return false;
  return true;
}

// ---- ① filter ----

/** Extra (non-English) languages the traveller asked for — venues must list one of them. */
const extraLanguages = (profile: GlowUpProfile): GlowUpLanguage[] => profile.languages.filter((l) => l !== 'English');

function languageOk(place: GlowUpPlace, profile: GlowUpProfile): boolean {
  const extra = extraLanguages(profile);
  if (extra.length > 0) return place.languages.some((l) => extra.includes(l));
  return languageFit(place, ['English']) !== false;
}

/**
 * Venues that can serve `subtype` in the traveller's city. Language is a hard filter unless it would
 * leave nothing (a pick is never dropped); the area is not a filter here — venues outside it are
 * kept and lose location points instead, used only when the area has none (see `inAreaFirst`).
 */
export function eligible(subtype: GlowUpSubtype, profile: GlowUpProfile, places: GlowUpPlace[], city: 'seoul' | 'busan'): GlowUpPlace[] {
  const base = places.filter((p) => serves(p, subtype) && p.city === city && p.lat != null && p.lng != null && Boolean(p.bookingUrl));
  const spoken = base.filter((p) => languageOk(p, profile));
  return spoken.length > 0 ? spoken : base;
}

/** 1st pass: only venues inside the chosen area. 2nd pass (none there): the whole city, nearest first by score. */
export function inAreaFirst(pool: GlowUpPlace[], region: AppRegion | null): GlowUpPlace[] {
  if (!region) return pool;
  const inside = pool.filter((p) => p.region === region);
  return inside.length > 0 ? inside : pool;
}

// ---- ② score ----

interface CategoryStats {
  meanRating: number;
  medianReviews: number;
  /** Bayesian rating range across the category, for 0–1 scaling. */
  minAdj: number;
  maxAdj: number;
  /** Sorted demand values across the category, for percentiles. */
  demand: number[];
}

const statsCache = new WeakMap<GlowUpPlace[], Map<GlowUpSubtype, CategoryStats>>();

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const adjusted = (p: GlowUpPlace, st: Pick<CategoryStats, 'meanRating' | 'medianReviews'>): number => {
  const v = p.reviewCount ?? 0;
  const m = st.medianReviews;
  if (p.rating == null || v + m === 0) return st.meanRating;
  return (v / (v + m)) * p.rating + (m / (v + m)) * st.meanRating;
};

/** Foreign demand: Creatrip bookings + reviews, log-scaled so one mega-venue can't take every point. */
const demandOf = (p: GlowUpPlace): number => Math.log10(1 + (p.bookedCount ?? 0)) + Math.log10(1 + (p.reviewCount ?? 0));

function statsFor(subtype: GlowUpSubtype, places: GlowUpPlace[]): CategoryStats {
  let bySubtype = statsCache.get(places);
  if (!bySubtype) statsCache.set(places, (bySubtype = new Map()));
  const hit = bySubtype.get(subtype);
  if (hit) return hit;

  const pool = places.filter((p) => serves(p, subtype));
  const rated = pool.filter((p) => p.rating != null);
  const meanRating = rated.length ? rated.reduce((s, p) => s + (p.rating as number), 0) / rated.length : 4.5;
  const medianReviews = median(pool.map((p) => p.reviewCount ?? 0));
  const adj = pool.map((p) => adjusted(p, { meanRating, medianReviews }));
  const stats: CategoryStats = {
    meanRating,
    medianReviews,
    minAdj: adj.length ? Math.min(...adj) : 0,
    maxAdj: adj.length ? Math.max(...adj) : 0,
    demand: pool.map(demandOf).sort((a, b) => a - b),
  };
  bySubtype.set(subtype, stats);
  return stats;
}

const percentile = (sorted: number[], x: number): number => {
  if (sorted.length <= 1) return 1;
  const below = sorted.filter((v) => v < x).length;
  const equal = sorted.filter((v) => v === x).length;
  return (below + (equal - 1) / 2) / (sorted.length - 1);
};

const FRESH_DAYS = 90;
const CORE_FIELDS = ['price_min_usd', 'languages', 'duration_min'];

/** 0–1: core fields filled (link, language, price) + fewer scraper gaps + a capture within 90 days. */
export function reliabilityOf(p: GlowUpPlace, today = new Date()): number {
  const core = [Boolean(p.bookingUrl), p.languages.length > 0 || p.englishSupport != null, p.priceFromUsd != null || p.priceType === 'free'];
  const coreScore = core.filter(Boolean).length / core.length;
  const gaps = p.missingFields.filter((f) => CORE_FIELDS.includes(f)).length + p.missingFields.length * 0.5;
  const gapScore = Math.max(0, 1 - gaps / 4);
  let fresh = 0.5;
  if (p.capturedAt) {
    const days = (today.getTime() - new Date(p.capturedAt).getTime()) / 86_400_000;
    fresh = Number.isFinite(days) && days <= FRESH_DAYS ? 1 : 0;
  }
  return coreScore * 0.5 + gapScore * 0.3 + fresh * 0.2;
}

interface Points {
  quality: number;
  demand: number;
  location: number;
  reliability: number;
  budget: number;
  /** Only used by the "Less Downtime" mix. */
  downtime: number;
}

const BASE_POINTS: Points = { quality: 25, demand: 25, location: 20, reliability: 10, budget: 5, downtime: 0 };

/** "Try another mix" only moves points around — the filters and the combination step stay the same. */
export function pointsFor(preset: GlowUpMixPreset | null | undefined): Points {
  switch (preset) {
    case 'less-downtime':
      return { ...BASE_POINTS, downtime: 30 };
    case 'closer':
      return { ...BASE_POINTS, location: 45 };
    case 'lower-budget':
      return { ...BASE_POINTS, budget: 30 };
    case 'iconic':
      return { ...BASE_POINTS, demand: 45, quality: 30 };
    default:
      return BASE_POINTS;
  }
}

/** Location points by estimated travel minutes from the area centre, when the venue is outside it. */
function locationShare(place: GlowUpPlace, region: AppRegion | null, anchor: LatLng | null): number {
  if (region && place.region === region) return 1;
  const from = anchor ?? (region ? REGION_CENTRE[region] : null);
  if (!from) return 1;
  const min = minutesBetween(from, point(place));
  if (min <= 10) return 17 / 20;
  if (min <= 20) return 12 / 20;
  if (min < 40) return 6 / 20;
  return 0;
}

function budgetShare(place: GlowUpPlace, profile: GlowUpProfile, preset: GlowUpMixPreset | null | undefined): number {
  const max = budgetMaxUsdOf(profile);
  if (place.priceFromUsd == null) return 3 / 5;
  if (max != null && place.priceFromUsd > max) return 0;
  // "Lower Budget": cheaper wins within the range, not just "fits".
  if (preset === 'lower-budget') return Math.max(0, 1 - place.priceFromUsd / (max ?? 300)) * 0.8 + 0.2;
  return 1;
}

const DOWNTIME_SHARE = { none: 1, mild: 0.3, days: 0 } as const;

export interface ScoreInput {
  profile: GlowUpProfile;
  places: GlowUpPlace[];
  region: AppRegion | null;
  preset: GlowUpMixPreset | null | undefined;
}

/** 0–100 for one venue serving `subtype`. */
export function scorePlace(place: GlowUpPlace, subtype: GlowUpSubtype, input: ScoreInput, anchor: LatLng | null = null): number {
  const st = statsFor(subtype, input.places);
  const pts = pointsFor(input.preset);
  const quality = st.maxAdj > st.minAdj ? (adjusted(place, st) - st.minAdj) / (st.maxAdj - st.minAdj) : 1;
  const demand = percentile(st.demand, demandOf(place));
  const location = locationShare(place, input.region, anchor);
  const reliability = reliabilityOf(place);
  const budget = budgetShare(place, input.profile, input.preset);
  const downtime = place.downtime ? DOWNTIME_SHARE[place.downtime] : 0.5;
  const total = pts.quality + pts.demand + pts.location + pts.reliability + pts.budget + pts.downtime;
  const raw =
    quality * pts.quality +
    demand * pts.demand +
    location * pts.location +
    reliability * pts.reliability +
    budget * pts.budget +
    downtime * pts.downtime;
  return (raw / total) * 100;
}

// ---- ④ tie-break ----

export interface Scored {
  place: GlowUpPlace;
  subtype: GlowUpSubtype;
  score: number;
}

/** Score desc → data reliability → latest capture → id. Refreshing never reshuffles. */
export function compareScored(a: Scored, b: Scored): number {
  return (
    b.score - a.score ||
    reliabilityOf(b.place) - reliabilityOf(a.place) ||
    (b.place.capturedAt ?? '').localeCompare(a.place.capturedAt ?? '') ||
    a.place.id.localeCompare(b.place.id)
  );
}

/** Top `n` venues for one slot (a category, or several for the clinic slot). */
export function topFor(subtypes: GlowUpSubtype[], input: ScoreInput, city: 'seoul' | 'busan', n: number): Scored[] {
  const seen = new Set<string>();
  const out: Scored[] = [];
  for (const subtype of subtypes) {
    for (const place of inAreaFirst(eligible(subtype, input.profile, input.places, city), input.region)) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      out.push({ place, subtype: SKIN_GROUP.includes(place.subtype) && subtypes.includes(place.subtype) ? place.subtype : subtype, score: scorePlace(place, subtype, input) });
    }
  }
  return out.sort(compareScored).slice(0, n);
}

// ---- ③ routine-level combination ----

/** Points lost per estimated travel minute between consecutive stops. */
const TRAVEL_PENALTY_PER_MIN = 0.25;
export const COMBO_TOP_N = 5;

/**
 * Best venue per slot, chosen together: every combination of each slot's top 5 (≤125 for three
 * slots) is scored as mean venue score − travel penalty. One venue may fill two slots when it
 * offers both (a jjimjilbang doing sauna and scrub).
 */
export function bestCombination(slots: Scored[][]): Scored[] | null {
  if (slots.some((s) => s.length === 0)) return null;
  let best: { combo: Scored[]; value: number; key: string } | null = null;
  const walk = (i: number, acc: Scored[]) => {
    if (i === slots.length) {
      const mean = acc.reduce((s, x) => s + x.score, 0) / acc.length;
      let travel = 0;
      for (let k = 1; k < acc.length; k++) {
        if (acc[k].place.id !== acc[k - 1].place.id) travel += minutesBetween(point(acc[k - 1].place), point(acc[k].place));
      }
      const value = mean - travel * TRAVEL_PENALTY_PER_MIN;
      const key = acc.map((x) => x.place.id).join('|');
      if (!best || value > best.value + 1e-9 || (Math.abs(value - best.value) <= 1e-9 && key < best.key)) {
        best = { combo: [...acc], value, key };
      }
      return;
    }
    for (const cand of slots[i]) walk(i + 1, [...acc, cand]);
  };
  walk(0, []);
  return best ? (best as { combo: Scored[] }).combo : null;
}

// ---- ⑤ "You decide" ----

/**
 * No area picked: anchor on the area with the highest sum of top-candidate scores across every
 * picked category — never random, so a refresh gives the same base.
 */
export function anchorRegion(
  subtypes: GlowUpSubtype[],
  profile: GlowUpProfile,
  places: GlowUpPlace[],
  city: 'seoul' | 'busan',
  preset: GlowUpMixPreset | null | undefined
): AppRegion {
  const regions = CITY_REGIONS[city];
  let best = regions[0];
  let bestSum = -Infinity;
  for (const region of regions) {
    const input: ScoreInput = { profile, places, region, preset };
    let sum = 0;
    for (const subtype of subtypes) {
      const top = eligible(subtype, profile, places, city)
        .map((p) => scorePlace(p, subtype, input))
        .sort((a, b) => b - a)[0];
      sum += top ?? 0;
    }
    if (sum > bestSum + 1e-9) {
      best = region;
      bestSum = sum;
    }
  }
  return best;
}
