import type { Place } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { isMissingRelation } from '../lib/supabaseError';

export interface SavedPlaceEntry {
  placeId: string;
  snapshot: Place;
  savedAt: string;
}

function mapRow(row: { place_id: string; snapshot: Place; saved_at: string }): SavedPlaceEntry | null {
  const snapshot = row.snapshot;
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.id) return null;
  return {
    placeId: row.place_id,
    snapshot,
    savedAt: row.saved_at,
  };
}

export function mergeSaved(local: SavedPlaceEntry[], remote: SavedPlaceEntry[]): SavedPlaceEntry[] {
  const byId = new Map<string, SavedPlaceEntry>();
  for (const entry of [...local, ...remote]) {
    const prev = byId.get(entry.placeId);
    if (!prev || entry.savedAt > prev.savedAt) byId.set(entry.placeId, entry);
  }
  return [...byId.values()].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function fetchRemoteSavedPlaces(userId?: string): Promise<SavedPlaceEntry[] | null> {
  if (!isRemoteUser(userId) || !supabase) return null;
  const { data, error } = await supabase
    .from('saved_places')
    .select('place_id, snapshot, saved_at')
    .eq('user_id', userId!)
    .order('saved_at', { ascending: false });
  if (error) {
    console.warn('fetchRemoteSavedPlaces failed', error);
    return null;
  }
  return (data ?? []).map(mapRow).filter((e): e is SavedPlaceEntry => e !== null);
}

async function upsertPlace(userId: string, entry: SavedPlaceEntry): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    user_id: userId,
    place_id: entry.placeId,
    snapshot: entry.snapshot,
    saved_at: entry.savedAt,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from('saved_places').upsert(payload, { onConflict: 'user_id,place_id' });
    if (!error) return true;
    console.warn('insertRemoteSavedPlace failed', error);
    if (isMissingRelation(error)) return false;
  }
  return false;
}

export async function insertRemoteSavedPlace(userId: string | undefined, entry: SavedPlaceEntry): Promise<boolean> {
  if (!isRemoteUser(userId) || !supabase) return false;
  return upsertPlace(userId!, entry);
}

/** Upload rows the cloud is missing or has an older savedAt for. */
export async function pushLocalSavedPlaces(
  userId: string | undefined,
  local: SavedPlaceEntry[],
  remote: SavedPlaceEntry[]
): Promise<boolean> {
  if (!isRemoteUser(userId) || local.length === 0) return true;
  const byRemote = new Map(remote.map((entry) => [entry.placeId, entry]));
  let ok = true;
  for (const entry of local) {
    const existing = byRemote.get(entry.placeId);
    if (existing && existing.savedAt >= entry.savedAt) continue;
    if (!(await upsertPlace(userId!, entry))) ok = false;
  }
  return ok;
}

export async function deleteRemoteSavedPlace(userId: string | undefined, placeId: string): Promise<boolean> {
  if (!isRemoteUser(userId) || !supabase) return false;
  const { error } = await supabase.from('saved_places').delete().eq('user_id', userId!).eq('place_id', placeId);
  if (error) {
    console.warn('deleteRemoteSavedPlace failed', error);
    return false;
  }
  return true;
}
