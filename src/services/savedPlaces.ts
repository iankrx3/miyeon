import type { Place } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { isMissingRelation, isMissingRpc } from '../lib/supabaseError';
import { listTombstones, removeTombstone, TOMBSTONE_PLACES } from '../lib/syncTombstones';

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

export function excludeDeletedPlaces(entries: SavedPlaceEntry[], userId?: string): SavedPlaceEntry[] {
  const dead = listTombstones(TOMBSTONE_PLACES, userId);
  if (dead.size === 0) return entries;
  return entries.filter((entry) => !dead.has(entry.placeId));
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

export async function pushLocalSavedPlaces(
  userId: string | undefined,
  local: SavedPlaceEntry[],
  remote: SavedPlaceEntry[]
): Promise<boolean> {
  if (!isRemoteUser(userId) || local.length === 0) return true;
  const dead = listTombstones(TOMBSTONE_PLACES, userId);
  const byRemote = new Map(remote.map((entry) => [entry.placeId, entry]));
  let ok = true;
  for (const entry of local) {
    if (dead.has(entry.placeId)) continue;
    const existing = byRemote.get(entry.placeId);
    if (existing && existing.savedAt >= entry.savedAt) continue;
    if (!(await upsertPlace(userId!, entry))) ok = false;
  }
  return ok;
}

export async function deleteRemoteSavedPlace(userId: string | undefined, placeId: string): Promise<boolean> {
  if (!isRemoteUser(userId) || !supabase) return false;

  const { data: rpcCount, error: rpcError } = await supabase.rpc('delete_own_saved_place', {
    p_place_id: placeId,
  });
  if (!rpcError && typeof rpcCount === 'number') return rpcCount > 0;
  if (rpcError && !isMissingRpc(rpcError)) {
    console.warn('deleteRemoteSavedPlace rpc failed', rpcError);
    return false;
  }

  const { data, error } = await supabase
    .from('saved_places')
    .delete()
    .eq('user_id', userId!)
    .eq('place_id', placeId)
    .select('place_id');
  if (error) {
    console.warn('deleteRemoteSavedPlace failed', error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/** Retry cloud deletes for tombstoned ids; drop tombstones once the cloud agrees. */
export async function reconcileDeletedPlaces(userId: string | undefined, remote: SavedPlaceEntry[]): Promise<void> {
  if (!isRemoteUser(userId)) return;
  const remoteIds = new Set(remote.map((entry) => entry.placeId));
  for (const id of listTombstones(TOMBSTONE_PLACES, userId)) {
    if (remoteIds.has(id)) {
      await deleteRemoteSavedPlace(userId, id);
    } else {
      removeTombstone(TOMBSTONE_PLACES, userId, id);
    }
  }
}
