import type { Itinerary, SavedItinerary } from '../types';
import { supabase } from '../lib/supabase';
import { DEMO_USER } from './auth';
import { upsertItinerary } from '../lib/localItineraryStore';

function isRemoteUser(userId?: string): boolean {
  return Boolean(supabase && userId && userId !== DEMO_USER.id && !userId.startsWith('mock-'));
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
    source: row.source === 'curator' ? 'curator' : 'miyeon',
    snapshot: row.snapshot,
    savedAt: row.saved_at,
  };
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
  if (error) console.warn('insertRemoteSavedItinerary failed', error);
}

export async function deleteRemoteSavedItinerary(userId: string | undefined, itineraryId: string) {
  if (!isRemoteUser(userId) || !supabase) return;
  const { error } = await supabase
    .from('saved_itineraries')
    .delete()
    .eq('user_id', userId!)
    .or(`itinerary_id.eq.${itineraryId},id.eq.${itineraryId}`);
  if (error) console.warn('deleteRemoteSavedItinerary failed', error);
}
