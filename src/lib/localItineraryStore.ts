import type { Itinerary, SavedItinerary } from '../types';
import { mockCreators } from '../data/mock';
import { getSpot } from '../data/spots';
import { emptyProfile, generateItinerary } from '../services/itinerary/generate';

const ITINERARIES_KEY = 'miyeon_itineraries';
const SAVED_KEY = 'miyeon_saved_itineraries';
const SEEDED_KEY = 'miyeon_itineraries_seeded_v1';

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

  const profile = {
    ...emptyProfile(),
    purpose: 'korean-experience' as const,
    goals: ['makeup-style' as const, 'hair' as const],
    nothingOffLimits: false,
    restrictions: ['need-communication' as const],
    budget: '300-500' as const,
    beautyTime: 'half-day' as const,
    tripDays: '2' as const,
    downtime: 'few-hours' as const,
  };

  const a = generateItinerary(profile);
  a.id = 'itn_seed_seoulskin';
  a.source = 'curator';
  a.curatorId = mockCreators[0].id;
  a.title = 'Soft Seoul, two days';
  a.description = 'Color first, then hair — Gangnam and Seongsu.';

  const b = generateItinerary({
    ...profile,
    purpose: 'feel-good',
    goals: ['hair', 'details'],
    beautyTime: 'couple-hours',
    tripDays: '1',
  });
  b.id = 'itn_seed_mina';
  b.source = 'curator';
  b.curatorId = mockCreators[1].id;
  b.title = 'Hongdae hair & makeup';
  b.description = 'A short, very Korean afternoon.';

  const existing = readJson<Itinerary[]>(ITINERARIES_KEY, []);
  const ids = new Set(existing.map((i) => i.id));
  const seeded = [a, b].filter((i) => !ids.has(i.id) && i.days.length > 0);
  writeJson(ITINERARIES_KEY, [...existing, ...seeded]);
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

export function listCuratorItineraries(curatorId: string): Itinerary[] {
  return listItineraries().filter((i) => i.source === 'curator' && i.curatorId === curatorId);
}

export function listAllCuratorItineraries(): Itinerary[] {
  return listItineraries().filter((i) => i.source === 'curator');
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
