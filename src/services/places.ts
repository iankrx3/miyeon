import { Creator, CreatorPick, Place, Treatment } from '../types';
import { mapCreator, mapPlace } from '../lib/mappers';
import { supabase } from '../lib/supabase';
import {
  mockCreatorPicks,
  mockCreators,
  mockPlaces,
  mockTreatments,
} from '../data/mock';
import {
  catalogPlace,
  catalogTreatment,
  discoverAll,
} from './discovery';
import { getSpot, spotToPlace } from '../data/spots';
import { getApiHealth } from './googlePlaces';

async function liveCatalog() {
  const health = await getApiHealth();
  if (!health.google && !health.kto) return null;
  try {
    const result = await discoverAll();
    if (result.places.length === 0) return null;
    return result;
  } catch (err) {
    console.warn('Live place discovery failed; using mock data', err);
    return null;
  }
}

async function livePlaces(): Promise<Place[] | null> {
  const catalog = await liveCatalog();
  return catalog?.places ?? null;
}

async function liveTreatments(): Promise<Treatment[] | null> {
  const catalog = await liveCatalog();
  return catalog?.treatments ?? null;
}

export async function fetchPlaces(): Promise<Place[]> {
  return (await livePlaces()) ?? mockPlaces;
}

export async function fetchPlaceById(id: string): Promise<Place | null> {
  const fromCatalog = getSpot(id);
  if (fromCatalog) return spotToPlace(fromCatalog);
  const remembered = catalogPlace(id);
  if (remembered) return remembered;
  const mock = mockPlaces.find((place) => place.id === id);
  if (mock) return mock;
  const places = await fetchPlaces();
  return places.find((place) => place.id === id) ?? null;
}

export async function fetchTreatments(): Promise<Treatment[]> {
  return (await liveTreatments()) ?? mockTreatments;
}

export async function fetchTreatmentById(id: string): Promise<Treatment | null> {
  const remembered = catalogTreatment(id);
  if (remembered) return remembered;
  const mock = mockTreatments.find((treatment) => treatment.id === id);
  if (mock) return mock;
  const treatments = await fetchTreatments();
  return treatments.find((treatment) => treatment.id === id) ?? null;
}

export async function fetchCreators(): Promise<Creator[]> {
  if (!supabase) return mockCreators;
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*, creator_picks(id)')
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return mockCreators;
    return data.map((row: any) => mapCreator(row, row.creator_picks?.length || 0));
  } catch (err) {
    console.warn('fetchCreators: Supabase query failed, falling back to mock creators', err);
    return mockCreators;
  }
}

export async function fetchCreatorByUserId(userId: string): Promise<Creator | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*, creator_picks(id)')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapCreator(data, data.creator_picks?.length || 0);
  } catch (err) {
    console.warn('fetchCreatorByUserId: Supabase query failed', err);
    return null;
  }
}

/** Batch-resolves auth user ids to Creator ids, e.g. to decide which Community
 * post authors should link to a Curator profile. */
export async function fetchCreatorIdsByUserIds(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return new Map();
  if (!supabase) {
    return new Map(mockCreators.filter((c) => unique.includes(c.user_id)).map((c) => [c.user_id, c.id]));
  }
  try {
    const { data, error } = await supabase.from('creators').select('id, user_id').in('user_id', unique);
    if (error) throw error;
    return new Map((data ?? []).map((row: any) => [row.user_id, row.id]));
  } catch (err) {
    console.warn('fetchCreatorIdsByUserIds: Supabase query failed', err);
    return new Map();
  }
}

export async function fetchCreatorById(id: string): Promise<Creator | null> {
  if (!supabase) return mockCreators.find((creator) => creator.id === id) ?? null;
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*, creator_picks(id)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return mockCreators.find((creator) => creator.id === id) ?? null;
    return mapCreator(data, data.creator_picks?.length || 0);
  } catch (err) {
    console.warn('fetchCreatorById: Supabase query failed, falling back to mock creators', err);
    return mockCreators.find((creator) => creator.id === id) ?? null;
  }
}

export async function fetchCreatorPicksByCreatorId(creatorId: string): Promise<CreatorPick[]> {
  if (!supabase) return mockCreatorPicks.filter((pick) => pick.creator_id === creatorId);
  try {
    // No place:places(*) embed here — creator_picks.place_id has no FK to `places`
    // (dropped along with list_spots'; see supabase/creators_schema.sql), and this
    // legacy table has no place_snapshot column either since nothing writes to it
    // anymore. Guard against a (currently nonexistent) row lacking place data.
    const { data, error } = await supabase
      .from('creator_picks')
      .select('*, creator:creators(*)')
      .eq('creator_id', creatorId);
    if (error) throw error;
    if (!data || data.length === 0) return mockCreatorPicks.filter((pick) => pick.creator_id === creatorId);
    return data
      .filter((row: any) => row.place)
      .map((row: any) => ({
        id: row.id,
        creator_id: row.creator_id,
        creator: mapCreator(row.creator),
        place_id: row.place_id,
        place: mapPlace(row.place),
        personal_note: row.personal_note || '',
        created_at: row.created_at,
      }));
  } catch (err) {
    console.warn('fetchCreatorPicksByCreatorId: Supabase query failed, falling back to mock picks', err);
    return mockCreatorPicks.filter((pick) => pick.creator_id === creatorId);
  }
}

/** Derives "Curated by Creators" entries from real list activity (creator_lists/list_spots),
 * since nothing writes to the legacy `creator_picks` table anymore. Fails soft to []. */
async function fetchListSpotCreatorPicks(): Promise<CreatorPick[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('list_spots')
      .select('id, place_id, note, created_at, place_snapshot, list:creator_lists(id, creator:creators(*))')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? [])
      .filter((row: any) => row.list?.creator && row.place_snapshot)
      .map((row: any) => ({
        id: `list-spot-${row.id}`,
        creator_id: row.list.creator.id,
        creator: mapCreator(row.list.creator),
        place_id: row.place_id,
        place: { ...row.place_snapshot, id: row.place_id },
        personal_note: row.note || '',
        created_at: row.created_at,
      }));
  } catch (err) {
    console.warn('fetchListSpotCreatorPicks: Supabase query failed', err);
    return [];
  }
}

/** Keeps one pick per creator (the most recent) for the "Curated by Creators" strip. */
export function dedupeCreatorPicksByCreator(picks: CreatorPick[]): CreatorPick[] {
  const byCreator = new Map<string, CreatorPick>();
  for (const pick of picks) {
    const existing = byCreator.get(pick.creator_id);
    if (!existing || new Date(pick.created_at).getTime() > new Date(existing.created_at).getTime()) {
      byCreator.set(pick.creator_id, pick);
    }
  }
  return Array.from(byCreator.values());
}

/** Every place any curator has picked (legacy `creator_picks` + `list_spots`), one entry
 * per pick — not deduped by creator. Used to derive the Map tab's "curator-added places
 * only" data set. Falls back to `mockCreatorPicks`. */
export async function fetchAllCreatorPicks(): Promise<CreatorPick[]> {
  if (!supabase) return mockCreatorPicks;
  try {
    // No place:places(*) embed on creator_picks — see fetchCreatorPicksByCreatorId note.
    const [{ data, error }, listPicks] = await Promise.all([
      supabase.from('creator_picks').select('*, creator:creators(*)'),
      fetchListSpotCreatorPicks(),
    ]);
    if (error) throw error;
    const legacyPicks: CreatorPick[] = (data ?? [])
      .filter((row: any) => row.place)
      .map((row: any) => ({
        id: row.id,
        creator_id: row.creator_id,
        creator: mapCreator(row.creator),
        place_id: row.place_id,
        place: mapPlace(row.place),
        personal_note: row.personal_note || '',
        created_at: row.created_at,
      }));
    const merged = [...legacyPicks, ...listPicks];
    return merged.length > 0 ? merged : mockCreatorPicks;
  } catch (err) {
    console.warn('fetchAllCreatorPicks: Supabase query failed, falling back to mock picks', err);
    return mockCreatorPicks;
  }
}

/** Keeps one pick per creator (the most recent) — used for the "Curated by Creators" strip. */
export async function fetchCreatorPicks(): Promise<CreatorPick[]> {
  return dedupeCreatorPicksByCreator(await fetchAllCreatorPicks());
}
