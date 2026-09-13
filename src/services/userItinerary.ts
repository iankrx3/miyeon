import type { Itinerary, UserSession } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { supabase } from '../lib/supabase';
import { isMissingRelation } from '../lib/supabaseError';
import { createBlankItinerary } from './itinerary/generate';
import { listUserItineraries, removeItinerary, upsertItinerary } from '../lib/localItineraryStore';

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

async function upsertRemote(userId: string, itinerary: Itinerary): Promise<boolean> {
  if (!supabase) return false;
  const payload = remotePayload(itinerary, userId);
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from('user_itineraries').upsert(payload, { onConflict: 'id' });
    if (!error) return true;
    console.warn('persistUserItinerary failed', error);
    if (isMissingRelation(error)) return false;
  }
  return false;
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
      console.warn('createUserItinerary: saving locally', err);
    }
  }

  upsertItinerary(blank);
  return blank;
}

export async function persistUserItinerary(session: UserSession, itinerary: Itinerary): Promise<Itinerary> {
  upsertItinerary(itinerary);
  if (!session.user || !isRemoteUser(session.user.id) || !supabase) return itinerary;
  await upsertRemote(session.user.id, itinerary);
  return itinerary;
}

export async function fetchUserItineraries(userId: string): Promise<{ itineraries: Itinerary[]; syncError: string | null }> {
  const local = listUserItineraries(userId);
  if (!isRemoteUser(userId) || !supabase) return { itineraries: local, syncError: null };
  try {
    const { data, error } = await supabase
      .from('user_itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    const remote = (data ?? []).map(mapUserItinerary);
    remote.forEach(upsertItinerary);

    const byId = new Map<string, Itinerary>();
    for (const item of [...local, ...remote]) {
      const prev = byId.get(item.id);
      if (!prev || item.updatedAt > prev.updatedAt) byId.set(item.id, item);
    }
    const merged = [...byId.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    const remoteById = new Map(remote.map((item) => [item.id, item]));
    let pushFailed = false;
    for (const item of merged) {
      const existing = remoteById.get(item.id);
      if (existing && existing.updatedAt >= item.updatedAt) continue;
      upsertItinerary(item);
      if (!(await upsertRemote(userId, item))) pushFailed = true;
    }

    return {
      itineraries: merged,
      syncError: pushFailed ? 'Could not sync your itineraries. Showing this device only.' : null,
    };
  } catch (err) {
    console.warn('fetchUserItineraries failed', err);
    return { itineraries: local, syncError: 'Could not sync your itineraries. Showing this device only.' };
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
  if (error) console.warn('deleteUserItinerary failed', error);
}
