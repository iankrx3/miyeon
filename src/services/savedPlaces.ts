import type { Place } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';

export interface SavedPlaceEntry {
  placeId: string;
  snapshot: Place;
  savedAt: string;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || /saved_places/i.test(error.message ?? '');
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

export async function fetchRemoteSavedPlaces(userId?: string): Promise<SavedPlaceEntry[] | null> {
  if (!isRemoteUser(userId) || !supabase) return null;
  const { data, error } = await supabase
    .from('saved_places')
    .select('place_id, snapshot, saved_at')
    .eq('user_id', userId!)
    .order('saved_at', { ascending: false });
  if (error) {
    if (!isMissingTable(error)) console.warn('fetchRemoteSavedPlaces failed', error);
    return null;
  }
  return (data ?? []).map(mapRow).filter((e): e is SavedPlaceEntry => e !== null);
}

export async function insertRemoteSavedPlace(userId: string | undefined, entry: SavedPlaceEntry) {
  if (!isRemoteUser(userId) || !supabase) return;
  const { error } = await supabase.from('saved_places').upsert(
    {
      user_id: userId,
      place_id: entry.placeId,
      snapshot: entry.snapshot,
      saved_at: entry.savedAt,
    },
    { onConflict: 'user_id,place_id' }
  );
  if (error && !isMissingTable(error)) console.warn('insertRemoteSavedPlace failed', error);
}

export async function deleteRemoteSavedPlace(userId: string | undefined, placeId: string) {
  if (!isRemoteUser(userId) || !supabase) return;
  const { error } = await supabase.from('saved_places').delete().eq('user_id', userId!).eq('place_id', placeId);
  if (error && !isMissingTable(error)) console.warn('deleteRemoteSavedPlace failed', error);
}
