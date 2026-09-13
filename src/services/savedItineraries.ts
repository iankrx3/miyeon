import type { Itinerary, SavedItinerary } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { upsertItinerary } from '../lib/localItineraryStore';

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || /saved_itineraries/i.test(error.message ?? '');
}

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
  for (const entry of local) byKey.set(entry.itineraryId, entry);
  for (const entry of remote) byKey.set(entry.itineraryId, entry);
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
    if (!isMissingTable(error)) console.warn('fetchRemoteSavedItineraries failed', error);
    return null;
  }
  const mapped = (data ?? []).map(mapRow);
  mapped.forEach((entry) => upsertItinerary(entry.snapshot));
  return mapped;
}

export async function insertRemoteSavedItinerary(userId: string | undefined, entry: SavedItinerary) {
  if (!isRemoteUser(userId) || !supabase) return;
  const { error } = await supabase.from('saved_itineraries').upsert(
    {
      user_id: userId,
      itinerary_id: entry.itineraryId,
      source: entry.source,
      snapshot: entry.snapshot,
      saved_at: entry.savedAt,
    },
    { onConflict: 'user_id,itinerary_id' }
  );
  if (error && !isMissingTable(error)) console.warn('insertRemoteSavedItinerary failed', error);
}

export async function deleteRemoteSavedItinerary(
  userId: string | undefined,
  keys: { itineraryId: string; savedId?: string; snapshotId?: string }
) {
  if (!isRemoteUser(userId) || !supabase) return;
  const parts = [`itinerary_id.eq.${keys.itineraryId}`];
  if (keys.snapshotId && keys.snapshotId !== keys.itineraryId) parts.push(`itinerary_id.eq.${keys.snapshotId}`);
  if (keys.savedId && keys.savedId !== keys.itineraryId) parts.push(`id.eq.${keys.savedId}`);
  const { error } = await supabase.from('saved_itineraries').delete().eq('user_id', userId!).or(parts.join(','));
  if (error && !isMissingTable(error)) console.warn('deleteRemoteSavedItinerary failed', error);
}
