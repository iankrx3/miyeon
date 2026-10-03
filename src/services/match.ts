import { MatchResult, Place, QuizAnswers, Treatment } from '../types';
import { discoverPlaces } from './discovery';
import { fetchPlaceById, fetchTreatments } from './places/places';

// AI Matching & Place Ranking — MIYEON Core UX §02-6/§02-7.
// Match Score = Concern + Result + Downtime + Budget + Timing + Location Fit
// + Foreigner Friendliness + Vibe Fit. This is a transparent, client-side
// stand-in for a real LLM/structured recommendation engine; it produces the
// same shape of output (MatchResult) so the UI doesn't change when a real
// backend replaces it.

const NEEDLE_KEYWORDS = /inject|filler|botox|needle|thread/i;

function vibeFit(vibes: string[], treatment: Treatment): number {
  const factors: number[] = [];

  const subtleDramatic = vibes[0];
  if (subtleDramatic) {
    const wantsDramatic = /clear difference/i.test(subtleDramatic);
    const intensityScore: Record<Treatment['intensity'], number> = wantsDramatic
      ? { high: 1, medium: 0.6, low: 0.2 }
      : { low: 1, medium: 0.6, high: 0.2 };
    factors.push(intensityScore[treatment.intensity]);
  }

  const needles = vibes[2];
  if (needles) {
    const isNeedleTreatment = NEEDLE_KEYWORDS.test(treatment.treatmentType);
    const wantsNoNeedles = /no needles|nothing that breaks/i.test(needles);
    const matched = wantsNoNeedles ? !isNeedleTreatment : true; // "needles are fine" never penalizes a device-based option
    factors.push(matched ? 1 : 0.3);
  }

  if (factors.length === 0) return 1;
  return factors.reduce((a, b) => a + b, 0) / factors.length;
}

const BUDGET_RANGE: Record<NonNullable<QuizAnswers['budget']>, [number, number]> = {
  'under-100': [0, 100],
  '100-300': [100, 300],
  '300-500': [300, 500],
  '500-plus': [500, Infinity],
};

function downtimeFit(want: QuizAnswers['downtime'], have: Treatment['downtime']): number {
  if (!want || want === 'no-mind') return 1;
  if (want === have) return 1;
  const order = ['none', '1-3-days', '3-7-days'];
  const wantIdx = order.indexOf(want);
  const haveIdx = order.indexOf(have);
  if (wantIdx === -1 || haveIdx === -1) return 0.5;
  return Math.max(0, 1 - Math.abs(wantIdx - haveIdx) * 0.4);
}

function timingFit(want: QuizAnswers['resultTiming'], have: Treatment['resultTiming']): number {
  if (!want) return 1;
  if (want === have) return 1;
  const order = ['asap', 'within-week', '1-2-weeks', 'long-term'];
  const wantIdx = order.indexOf(want);
  const haveIdx = order.indexOf(have);
  return Math.max(0, 1 - Math.abs(wantIdx - haveIdx) * 0.25);
}

function budgetFit(want: QuizAnswers['budget'], price: Treatment['price']): number {
  if (!want) return 1;
  const [min, max] = BUDGET_RANGE[want];
  const overlap = Math.min(price.max, max) - Math.max(price.min, min);
  if (overlap >= 0) return 1;
  const gap = Math.abs(overlap);
  return Math.max(0, 1 - gap / 200);
}

function concernFit(concerns: string[], treatment: Treatment): number {
  if (concerns.length === 0) return 0.7;
  const hit = treatment.concern.filter((c) => concerns.includes(c)).length;
  return Math.min(1, hit / Math.min(concerns.length, treatment.concern.length || 1));
}

export async function getMatches(
  answers: QuizAnswers,
  origin?: { lat: number; lng: number }
): Promise<MatchResult[]> {
  let candidates: Treatment[] = [];
  const placeById = new Map<string, Place>();

  if (answers.category) {
    try {
      const live = await discoverPlaces({
        category: answers.category,
        origin,
        keywordHints: answers.concerns,
        englishFriendly: true, // every Miyeon user is assumed to need English support — always checked
      });
      if (live.treatments.length > 0) {
        candidates = live.treatments;
        for (const place of live.places) placeById.set(place.id, place);
      }
    } catch (err) {
      console.warn('Live matching failed; falling back to mock treatments', err);
    }
  }

  if (candidates.length === 0) {
    const treatments = await fetchTreatments();
    candidates = answers.category ? treatments.filter((t) => t.category === answers.category) : treatments;
  }

  const scored = await Promise.all(
    candidates.map(async (treatment) => {
      const place = placeById.get(treatment.placeId) ?? (await fetchPlaceById(treatment.placeId));
      if (!place) return null;

      const cFit = concernFit(answers.concerns, treatment);
      const rFit = 0.85; // Result Fit — approximated until treatment outcome taxonomy exists
      const dFit = downtimeFit(answers.downtime, treatment.downtime);
      const bFit = budgetFit(answers.budget, treatment.price);
      const tFit = timingFit(answers.resultTiming, treatment.resultTiming);
      const vFit = vibeFit(answers.vibes, treatment);
      const locationFit = place.foreignerFriendly ? 0.9 : 0.6;
      const foreignerFit = treatment.foreignerFriendliness * 1.1; // English support is always checked

      const weights = {
        cFit: 0.25,
        rFit: 0.05,
        dFit: 0.15,
        bFit: 0.15,
        tFit: 0.15,
        locationFit: 0.1,
        foreignerFit: 0.05,
        vFit: 0.1,
      };
      const raw =
        cFit * weights.cFit +
        rFit * weights.rFit +
        dFit * weights.dFit +
        bFit * weights.bFit +
        tFit * weights.tFit +
        locationFit * weights.locationFit +
        Math.min(1, foreignerFit) * weights.foreignerFit +
        vFit * weights.vFit;

      const matchScore = Math.round(Math.min(0.99, raw) * 100);

      const reasons: string[] = [];
      if (cFit > 0.6) reasons.push('Best for your goal');
      if (dFit > 0.7) reasons.push('Suitable downtime');
      if (bFit > 0.7) reasons.push('Fits your budget');
      if (tFit > 0.7) reasons.push('Expected result timing');
      if (vFit > 0.7) reasons.push('Matches your vibe');
      if (treatment.foreignerFriendliness > 0.8) reasons.push('English consultation');
      reasons.push(`${place.area} location`);

      return { treatment, place, matchScore, reasons } satisfies MatchResult;
    })
  );

  return scored
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

export function placesForCategory(places: Place[], category: QuizAnswers['category']) {
  if (!category) return places;
  return places.filter((p) => p.category === category);
}
