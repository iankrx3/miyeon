import type { GlowUpMixPreset, GlowUpPlanV2, GlowUpProfile, GlowUpSubtype, Itinerary } from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { loadGlowUpPlaces } from '../places/glowUpPlaces';
import { buildRoutines, cityLabel, describeChange } from './routines';

export function emptyGlowUpProfile(): GlowUpProfile {
  return {
    fix: { items: [], downtime: null },
    change: [],
    restore: [],
    tripDays: null,
    region: null,
    budget: null,
    languages: [],
  };
}

const newId = (): string => `itn_${crypto.randomUUID()}`;

function wrap(profile: GlowUpProfile, plan: GlowUpPlanV2, base?: Itinerary): Itinerary {
  const stops = plan.routines.flatMap((r) => r.stops);
  const now = new Date().toISOString();
  const first = stops[0]?.subtype;
  return {
    id: base?.id ?? newId(),
    title: `${cityLabel(profile)} Glow Up`,
    source: 'miyeon',
    glowUpSnapshot: profile,
    glowUpV2: plan,
    // V2 plans are routines of real venues, not day blocks.
    days: [],
    estimatedSpendUsd: Math.round(stops.reduce((sum, s) => sum + (s.place.priceFromUsd ?? 0), 0)),
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
    coverPhotoUrl: first ? guideFor(first)?.image : undefined,
    description: `${plan.routines.length} routine${plan.routines.length === 1 ? '' : 's'} · ${stops.length} place${stops.length === 1 ? '' : 's'}`,
  };
}

/** Quiz profile → Glow Up plan of real venues (Supabase places, or the bundled seed). */
export async function buildGlowUpItinerary(profile: GlowUpProfile): Promise<Itinerary> {
  const places = await loadGlowUpPlaces();
  return wrap(profile, buildRoutines(profile, places));
}

/** "See another version": rebuild every routine for a preset and explain what changed. */
export async function remixItinerary(itinerary: Itinerary, preset: GlowUpMixPreset): Promise<Itinerary> {
  const profile = itinerary.glowUpSnapshot;
  const before = itinerary.glowUpV2;
  if (!profile || !before) return itinerary;
  const places = await loadGlowUpPlaces();
  const after = buildRoutines(profile, places, { preset, forced: before.forced });
  return wrap(profile, { ...after, changeNote: describeChange(before, after) }, itinerary);
}

/** "We left out X … Add": put a held-back category back into the plan. */
export async function addBackCategory(itinerary: Itinerary, subtype: GlowUpSubtype): Promise<Itinerary> {
  const profile = itinerary.glowUpSnapshot;
  const before = itinerary.glowUpV2;
  if (!profile || !before) return itinerary;
  const places = await loadGlowUpPlaces();
  const forced = [...new Set([...before.forced, subtype])];
  const after = buildRoutines(profile, places, { preset: before.mix, forced });
  return wrap(profile, after, itinerary);
}

/** Plans saved before V2 only hold the quiz answers — rebuild them as routines. */
export async function upgradeLegacyItinerary(itinerary: Itinerary): Promise<Itinerary | null> {
  if (!itinerary.glowUpSnapshot) return null;
  const places = await loadGlowUpPlaces();
  return wrap(itinerary.glowUpSnapshot, buildRoutines(itinerary.glowUpSnapshot, places), itinerary);
}
