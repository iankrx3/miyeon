import type { Itinerary, SavedItinerary } from '../types';
import { mockCuratorItineraries } from '../data/mockItineraries';
import { getSpot } from '../data/spots';

const ITINERARIES_KEY = 'miyeon_itineraries';
const SAVED_KEY = 'miyeon_saved_itineraries';
const SEEDED_KEY = 'miyeon_itineraries_seeded_v2';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota
  }
}

function seedCuratorItineraries() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(SEEDED_KEY)) return;

  const existing = readJson<Itinerary[]>(ITINERARIES_KEY, []);
  const seedIds = new Set(mockCuratorItineraries.map((i) => i.id));
  const kept = existing.filter((i) => !seedIds.has(i.id));
  writeJson(ITINERARIES_KEY, [...mockCuratorItineraries, ...kept]);
  localStorage.setItem(SEEDED_KEY, '1');
}

export function listItineraries(): Itinerary[] {
  seedCuratorItineraries();
  return readJson<Itinerary[]>(ITINERARIES_KEY, []);
}

export function getStoredItinerary(id: string): Itinerary | null {
  return listItineraries().find((i) => i.id === id) ?? null;
}

export function upsertItinerary(itinerary: Itinerary) {
  const all = listItineraries();
  const idx = all.findIndex((i) => i.id === itinerary.id);
  if (idx >= 0) all[idx] = itinerary;
  else all.unshift(itinerary);
  writeJson(ITINERARIES_KEY, all);
}

export function removeItinerary(id: string) {
  writeJson(
    ITINERARIES_KEY,
    listItineraries().filter((i) => i.id !== id)
  );
}

// Excludes `snap_`-prefixed itineraries: those are personal saved snapshots
// (see useSavedItineraries.saveItinerary) that clone a curator's source/curatorId
// verbatim so the map's "Saved itinerary" bar can show where they came from. Without this
// exclusion, saving a curator's itinerary would make it show up a second time
// in every "this curator's itineraries" listing (map picks, curator profile).
export function listCuratorItineraries(curatorId: string): Itinerary[] {
  return listItineraries().filter(
    (i) => i.source === 'curator' && i.curatorId === curatorId && !i.id.startsWith('snap_')
  );
}

export function listAllCuratorItineraries(): Itinerary[] {
  return listItineraries().filter((i) => i.source === 'curator' && !i.id.startsWith('snap_'));
}

/** A plain logged-in user's own manually-built itineraries (see
 * services/userItinerary.ts) — same `snap_` exclusion as listCuratorItineraries,
 * for the same reason (a saved/bookmarked clone shouldn't show up twice). */
export function listUserItineraries(userId: string): Itinerary[] {
  return listItineraries().filter(
    (i) => i.source === 'user' && i.userId === userId && !i.id.startsWith('snap_')
  );
}

/** True for a Glow Up plan made of category recommendations (no venue blocks). */
export function isCategoryPlan(itinerary: Itinerary): boolean {
  return (
    Boolean(itinerary.glowUpSnapshot && !itinerary.profileSnapshot) &&
    itinerary.days.every((d) => d.blocks.every((b) => !b.spotId && !b.venueName))
  );
}

/** The most recently generated Glow Up category plan — shown as "My Glow Up Plan" on the profile. */
export function latestGlowUpPlan(): Itinerary | null {
  const plans = listItineraries().filter(
    (i) => i.source === 'miyeon' && !i.id.startsWith('snap_') && isCategoryPlan(i)
  );
  plans.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return plans[0] ?? null;
}

export function savedKeyFor(userId?: string): string {
  return userId ? `${SAVED_KEY}:${userId}` : `${SAVED_KEY}:guest`;
}

export function listSavedItineraries(userId?: string): SavedItinerary[] {
  return readJson<SavedItinerary[]>(savedKeyFor(userId), []);
}

export function writeSavedItineraries(items: SavedItinerary[], userId?: string) {
  writeJson(savedKeyFor(userId), items);
}

/** Move guest bookmarks onto the signed-in user's key. Demo sessions stay local. */
export function migrateGuestSavedItineraries(userId?: string): SavedItinerary[] {
  const current = listSavedItineraries(userId);
  if (!userId) return current;
  const guest = listSavedItineraries(undefined);
  if (guest.length === 0) return current;
  const byKey = new Map<string, SavedItinerary>();
  for (const entry of [...guest, ...current]) {
    const prev = byKey.get(entry.itineraryId);
    if (!prev || entry.savedAt > prev.savedAt) byKey.set(entry.itineraryId, entry);
  }
  const merged = [...byKey.values()].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  writeSavedItineraries(merged, userId);
  writeSavedItineraries([], undefined);
  return merged;
}

export function firstSpotImage(itinerary: Itinerary): string | undefined {
  if (itinerary.coverPhotoUrl) return itinerary.coverPhotoUrl;
  for (const day of itinerary.days) {
    for (const block of day.blocks) {
      if (block.spotId) {
        const img = getSpot(block.spotId)?.images[0];
        if (img) return img;
      }
    }
  }
  return undefined;
}
