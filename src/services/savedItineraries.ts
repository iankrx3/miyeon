import type { Itinerary, SavedItinerary } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { isMissingRelation, isMissingRpc } from '../lib/supabaseError';
import { listTombstones, removeTombstone, TOMBSTONE_SAVED_ITINERARIES } from '../lib/syncTombstones';
import { upsertItinerary } from '../lib/localItineraryStore';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapSource(source: string): SavedItinerary['source'] {
  if (source === 'curator' || source === 'user' || source === 'miyeon') return source;
  return 'miyeon';
}

function mapRow(row: {
  id: string;
  itinerary_id: string;
  source: string;
  snapshot: Itinerary;
  saved_at: string;
}): SavedItinerary {
  return {
    savedId: row.id,
    itineraryId: row.itinerary_id,
    source: mapSource(row.source),
    snapshot: row.snapshot,
    savedAt: row.saved_at,
  };
}

export function mergeSavedItineraries(local: SavedItinerary[], remote: SavedItinerary[]): SavedItinerary[] {
  const byKey = new Map<string, SavedItinerary>();
  for (const entry of [...local, ...remote]) {
    const prev = byKey.get(entry.itineraryId);
    if (!prev || entry.savedAt > prev.savedAt) byKey.set(entry.itineraryId, entry);
  }
  return [...byKey.values()].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function savedItineraryKeys(entry: SavedItinerary): string[] {
  return [entry.itineraryId, entry.savedId, entry.snapshot?.id].filter((id): id is string => Boolean(id));
}

export function excludeDeletedSavedItineraries(entries: SavedItinerary[], userId?: string): SavedItinerary[] {
  const dead = listTombstones(TOMBSTONE_SAVED_ITINERARIES, userId);
  if (dead.size === 0) return entries;
  return entries.filter((entry) => !savedItineraryKeys(entry).some((id) => dead.has(id)));
}

export async function fetchRemoteSavedItineraries(userId?: string): Promise<SavedItinerary[] | null> {
  if (!isRemoteUser(userId) || !supabase) return null;
  const { data, error } = await supabase
    .from('saved_itineraries')
    .select('*')
    .eq('user_id', userId!)
    .order('saved_at', { ascending: false });
  if (error) {
    console.warn('fetchRemoteSavedItineraries failed', error);
    return null;
  }
  const mapped = (data ?? []).map(mapRow);
  mapped.forEach((entry) => upsertItinerary(entry.snapshot));
  return mapped;
}

async function upsertSaved(userId: string, entry: SavedItinerary): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    user_id: userId,
    itinerary_id: entry.itineraryId,
    source: entry.source,
    snapshot: entry.snapshot,
    saved_at: entry.savedAt,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from('saved_itineraries').upsert(payload, { onConflict: 'user_id,itinerary_id' });
    if (!error) return true;
    console.warn('insertRemoteSavedItinerary failed', error);
    if (isMissingRelation(error)) return false;
  }
  return false;
}

export async function insertRemoteSavedItinerary(userId: string | undefined, entry: SavedItinerary): Promise<boolean> {
  if (!isRemoteUser(userId) || !supabase) return false;
  return upsertSaved(userId!, entry);
}

export async function pushLocalSavedItineraries(
  userId: string | undefined,
  local: SavedItinerary[],
  remote: SavedItinerary[]
): Promise<boolean> {
  if (!isRemoteUser(userId) || local.length === 0) return true;
  const dead = listTombstones(TOMBSTONE_SAVED_ITINERARIES, userId);
  const byRemote = new Map(remote.map((entry) => [entry.itineraryId, entry]));
  let ok = true;
  for (const entry of local) {
    if (savedItineraryKeys(entry).some((id) => dead.has(id))) continue;
    const existing = byRemote.get(entry.itineraryId);
    if (existing && existing.savedAt >= entry.savedAt) continue;
    if (!(await upsertSaved(userId!, entry))) ok = false;
  }
  return ok;
}

export async function deleteRemoteSavedItinerary(
  userId: string | undefined,
  keys: { itineraryId: string; savedId?: string; snapshotId?: string }
): Promise<boolean> {
  if (!isRemoteUser(userId) || !supabase) return false;

  const itineraryIds = [...new Set([keys.itineraryId, keys.snapshotId].filter((id): id is string => Boolean(id)))];
  const rowId = keys.savedId && UUID_RE.test(keys.savedId) ? keys.savedId : null;

  let deleted = 0;
  let rpcMissing = false;
  for (const itineraryId of itineraryIds) {
    const { data: rpcCount, error: rpcError } = await supabase.rpc('delete_own_saved_itinerary', {
      p_itinerary_id: itineraryId,
      p_row_id: rowId,
    });
    if (!rpcError && typeof rpcCount === 'number') {
      deleted += rpcCount;
      continue;
    }
    if (rpcError && !isMissingRpc(rpcError)) {
      console.warn('deleteRemoteSavedItinerary rpc failed', rpcError);
      return false;
    }
    rpcMissing = true;
    break;
  }

  if (!rpcMissing) return deleted > 0;

  let ok = true;
  let tableDeleted = 0;
  for (const itineraryId of itineraryIds) {
    const { data, error } = await supabase
      .from('saved_itineraries')
      .delete()
      .eq('user_id', userId!)
      .eq('itinerary_id', itineraryId)
      .select('id');
    if (error) {
      console.warn('deleteRemoteSavedItinerary failed', error);
      ok = false;
    } else {
      tableDeleted += data?.length ?? 0;
    }
  }

  if (rowId) {
    const { data, error } = await supabase.from('saved_itineraries').delete().eq('user_id', userId!).eq('id', rowId).select('id');
    if (error) {
      console.warn('deleteRemoteSavedItinerary by id failed', error);
      ok = false;
    } else {
      tableDeleted += data?.length ?? 0;
    }
  }

  return ok && tableDeleted > 0;
}

export async function reconcileDeletedSavedItineraries(userId: string | undefined, remote: SavedItinerary[]): Promise<void> {
  if (!isRemoteUser(userId)) return;
  const remoteKeys = new Set(remote.flatMap(savedItineraryKeys));
  for (const id of listTombstones(TOMBSTONE_SAVED_ITINERARIES, userId)) {
    if (remoteKeys.has(id)) {
      await deleteRemoteSavedItinerary(userId, { itineraryId: id, savedId: UUID_RE.test(id) ? id : undefined });
    } else {
      removeTombstone(TOMBSTONE_SAVED_ITINERARIES, userId, id);
    }
  }
}
