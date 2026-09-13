import type { Itinerary, UserSession } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { createBlankItinerary } from './itinerary/generate';
import { listUserItineraries, removeItinerary, upsertItinerary } from '../lib/localItineraryStore';

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || /user_itineraries/i.test(error.message ?? '');
}

function mapUserItinerary(row: {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  days: Itinerary['days'];
  estimated_spend_usd?: number;
  created_at: string;
  updated_at?: string;
}): Itinerary {
  return {
    id: row.id,
    title: row.title,
    source: 'user',
    userId: row.user_id,
    days: row.days ?? [],
    estimatedSpendUsd: row.estimated_spend_usd ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    description: row.description ?? undefined,
  };
}

function remotePayload(itinerary: Itinerary, userId: string) {
  return {
    id: itinerary.id,
    user_id: userId,
    title: itinerary.title,
    description: itinerary.description ?? null,
    days: itinerary.days,
    estimated_spend_usd: itinerary.estimatedSpendUsd,
    created_at: itinerary.createdAt,
    updated_at: itinerary.updatedAt,
  };
}

export async function createUserItinerary(session: UserSession, title: string): Promise<Itinerary> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to create an itinerary.');
  const blank = createBlankItinerary(session.user.id, title, 'user');

  if (isRemoteUser(session.user.id) && supabase) {
    try {
      const { data, error } = await supabase.from('user_itineraries').insert(remotePayload(blank, session.user.id)).select().single();
      if (error) throw error;
      const mapped = mapUserItinerary(data);
      upsertItinerary(mapped);
      return mapped;
    } catch (err) {
      if (!isMissingTable(err as { code?: string; message?: string })) {
        console.warn('createUserItinerary: saving locally', err);
      }
    }
  }

  upsertItinerary(blank);
  return blank;
}

export async function persistUserItinerary(session: UserSession, itinerary: Itinerary): Promise<Itinerary> {
  upsertItinerary(itinerary);
  if (!session.user || !isRemoteUser(session.user.id) || !supabase) return itinerary;
  try {
    const { error } = await supabase
      .from('user_itineraries')
      .upsert(remotePayload(itinerary, session.user.id), { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    if (!isMissingTable(err as { code?: string; message?: string })) {
      console.warn('persistUserItinerary failed', err);
    }
  }
  return itinerary;
}

export async function fetchUserItineraries(userId: string): Promise<Itinerary[]> {
  const local = listUserItineraries(userId);
  if (!isRemoteUser(userId) || !supabase) return local;
  try {
    const { data, error } = await supabase
      .from('user_itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    const mapped = (data ?? []).map(mapUserItinerary);
    mapped.forEach(upsertItinerary);
    const ids = new Set(mapped.map((i) => i.id));
    return [...mapped, ...local.filter((i) => !ids.has(i.id))];
  } catch (err) {
    if (!isMissingTable(err as { code?: string; message?: string })) {
      console.warn('fetchUserItineraries failed', err);
    }
    return local;
  }
}

export async function fetchRemoteUserItinerary(id: string): Promise<Itinerary | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('user_itineraries').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const mapped = mapUserItinerary(data);
    upsertItinerary(mapped);
    return mapped;
  } catch {
    return null;
  }
}

export async function deleteUserItinerary(itineraryId: string, userId?: string): Promise<void> {
  removeItinerary(itineraryId);
  if (!isRemoteUser(userId) || !supabase) return;
  const { error } = await supabase.from('user_itineraries').delete().eq('id', itineraryId).eq('user_id', userId!);
  if (error && !isMissingTable(error)) console.warn('deleteUserItinerary failed', error);
}
