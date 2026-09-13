import type { Itinerary, SavedItinerary } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { isMissingRelation } from '../lib/supabaseError';
import { upsertItinerary } from '../lib/localItineraryStore';

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
  const byRemote = new Map(remote.map((entry) => [entry.itineraryId, entry]));
  let ok = true;
  for (const entry of local) {
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
  const parts = [`itinerary_id.eq.${keys.itineraryId}`];
  if (keys.snapshotId && keys.snapshotId !== keys.itineraryId) parts.push(`itinerary_id.eq.${keys.snapshotId}`);
  if (keys.savedId && keys.savedId !== keys.itineraryId) parts.push(`id.eq.${keys.savedId}`);
  const { error } = await supabase.from('saved_itineraries').delete().eq('user_id', userId!).or(parts.join(','));
  if (error) {
    console.warn('deleteRemoteSavedItinerary failed', error);
    return false;
  }
  return true;
}
