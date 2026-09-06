import type { Creator, CreatorPick, CuratorList, Itinerary, ListSpot, Place, UserSession } from '../types';
import { supabase } from '../lib/supabase';
import { mapCreator, mapCuratorList, mapListSpot } from '../lib/mappers';
import { mockCreatorPicks } from '../data/mock';
import { ENABLED_MAP_CATEGORIES } from '../data/mapCategories';
import { dedupeCreatorPicksByCreator, fetchAllCreatorPicks, fetchCreatorById as fetchRemoteCreatorById } from './places';
import { DEMO_USER } from './auth';
import {
  findLocalListById,
  readLocalCuratorById,
  readLocalLists,
  readLocalSpots,
  removeLocalList,
  removeLocalSpot,
  saveLocalCurator,
  saveLocalList,
  saveLocalSpot,
  updateLocalList,
} from '../lib/localCuratorStore';
import {
  getStoredItinerary,
  listAllCuratorItineraries,
  listCuratorItineraries,
  removeItinerary,
  upsertItinerary,
} from '../lib/localItineraryStore';
import { allSpotsAsPlaces, getSpot, spotToPlace } from '../data/spots';
import { mockCreators } from '../data/mock';
import { createBlankItinerary } from './itinerary/generate';

export interface CuratorProfileInput {
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  website_url?: string;
}

function isDemoSession(session: UserSession): boolean {
  return session.user?.id === DEMO_USER.id;
}

function isMockListId(listId: string): boolean {
  return listId.startsWith('mock-list-');
}

function isLocalListId(listId: string): boolean {
  return listId.startsWith('local-list-') || isMockListId(listId);
}

export async function createCurator(session: UserSession, input: CuratorProfileInput): Promise<Creator> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to become a curator.');
  const user = session.user;

  if (supabase && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .insert({
          user_id: user.id,
          username: input.username,
          display_name: input.display_name,
          bio: input.bio ?? '',
          avatar_url: input.avatar_url || user.avatar_url,
          instagram_url: input.instagram_url || null,
          tiktok_url: input.tiktok_url || null,
          website_url: input.website_url || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapCreator(data, 0);
    } catch (err) {
      console.error('createCurator: Supabase write failed unexpectedly, saving locally instead', err);
    }
  }

  const creator: Creator = {
    id: `local-creator-${crypto.randomUUID()}`,
    user_id: user.id,
    username: input.username,
    display_name: input.display_name,
    bio: input.bio ?? '',
    avatar_url: input.avatar_url || user.avatar_url,
    instagram_url: input.instagram_url || undefined,
    tiktok_url: input.tiktok_url || undefined,
    website_url: input.website_url || undefined,
    picks_count: 0,
    created_at: new Date().toISOString(),
  };
  saveLocalCurator(creator);
  return creator;
}

export async function updateCurator(session: UserSession, patch: Partial<CuratorProfileInput>): Promise<Creator> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to edit a profile.');
  const current = session.creator;

  if (supabase && !current.id.startsWith('local-creator-') && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('creators')
        .update({
          username: patch.username ?? current.username,
          display_name: patch.display_name ?? current.display_name,
          bio: patch.bio ?? current.bio,
          avatar_url: patch.avatar_url ?? current.avatar_url,
          instagram_url: patch.instagram_url ?? current.instagram_url ?? null,
          tiktok_url: patch.tiktok_url ?? current.tiktok_url ?? null,
          website_url: patch.website_url ?? current.website_url ?? null,
        })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      return mapCreator(data, current.picks_count);
    } catch (err) {
      console.error('updateCurator: Supabase write failed unexpectedly, saving locally instead', err);
    }
  }

  const updated: Creator = { ...current, ...patch };
  saveLocalCurator(updated);
  return updated;
}

export async function fetchCuratorById(id: string): Promise<Creator | null> {
  if (id.startsWith('local-creator-')) return readLocalCuratorById(id);
  return fetchRemoteCreatorById(id);
}

export async function fetchCuratorLists(curatorId: string): Promise<CuratorList[]> {
  if (curatorId.startsWith('local-creator-')) return readLocalLists(curatorId);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creator_lists')
        .select('*, list_spots(count)')
        .eq('curator_id', curatorId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((row: any) => mapCuratorList(row, row.list_spots?.[0]?.count ?? 0));
      }
    } catch (err) {
      console.warn('fetchCuratorLists: Supabase query failed, falling back to local/mock lists', err);
    }
  }

  const local = readLocalLists(curatorId);
  if (local.length > 0) return local;

  // Mock creators (from src/data/mock.ts) have no lists — wrap their existing
  // flat CreatorPicks into a single synthetic list so the profile page still
  // has something to show in demo mode.
  const picks = mockCreatorPicks.filter((pick) => pick.creator_id === curatorId);
  if (picks.length === 0) return [];
  return [
    {
      id: `mock-list-${curatorId}`,
      curator_id: curatorId,
      title: 'All Picks',
      cover_photo_url: picks[0].place.photoUrl,
      spot_count: picks.length,
      created_at: picks[0].created_at,
    },
  ];
}

export async function fetchListById(listId: string): Promise<CuratorList | null> {
  if (listId.startsWith('local-list-')) return findLocalListById(listId);
  if (isMockListId(listId)) {
    const curatorId = listId.replace('mock-list-', '');
    const lists = await fetchCuratorLists(curatorId);
    return lists.find((l) => l.id === listId) ?? null;
  }
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('creator_lists')
      .select('*, list_spots(count)')
      .eq('id', listId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return findLocalListById(listId);
    return mapCuratorList(data, data.list_spots?.[0]?.count ?? 0);
  } catch (err) {
    console.warn('fetchListById: Supabase query failed, falling back to local list', err);
    return findLocalListById(listId);
  }
}

export async function createList(
  session: UserSession,
  input: { title: string; description?: string }
): Promise<CuratorList> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to create a list.');
  const curator = session.creator;

  if (supabase && !curator.id.startsWith('local-creator-') && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('creator_lists')
        .insert({ curator_id: curator.id, title: input.title, description: input.description ?? null })
        .select()
        .single();
      if (error) throw error;
      return mapCuratorList(data, 0);
    } catch (err) {
      console.error('createList: Supabase write failed unexpectedly, saving locally instead', err);
    }
  }

  const list: CuratorList = {
    id: `local-list-${crypto.randomUUID()}`,
    curator_id: curator.id,
    title: input.title,
    description: input.description,
    spot_count: 0,
    created_at: new Date().toISOString(),
  };
  saveLocalList(list);
  return list;
}

export async function updateList(
  session: UserSession,
  listId: string,
  patch: { title?: string; description?: string }
): Promise<void> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to edit a list.');
  if (isLocalListId(listId)) {
    updateLocalList(session.creator.id, listId, patch);
    return;
  }
  if (!supabase) throw new Error('Unable to update list.');
  const { error } = await supabase
    .from('creator_lists')
    .update(patch)
    .eq('id', listId)
    .eq('curator_id', session.creator.id);
  if (error) throw error;
}

export async function deleteList(session: UserSession, listId: string): Promise<void> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to delete a list.');
  if (isLocalListId(listId)) {
    removeLocalList(session.creator.id, listId);
    return;
  }
  if (!supabase) throw new Error('Unable to delete list.');
  const { error } = await supabase.from('creator_lists').delete().eq('id', listId).eq('curator_id', session.creator.id);
  if (error) throw error;
}

export async function fetchListSpots(listId: string): Promise<ListSpot[]> {
  if (listId.startsWith('local-list-')) return readLocalSpots(listId);
  if (isMockListId(listId)) {
    const curatorId = listId.replace('mock-list-', '');
    return mockCreatorPicks
      .filter((pick) => pick.creator_id === curatorId)
      .map((pick, index) => ({
        id: `mock-spot-${pick.id}`,
        list_id: listId,
        place_id: pick.place_id,
        place: pick.place,
        note: pick.personal_note,
        position: index,
        created_at: pick.created_at,
      }));
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('list_spots')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map(mapListSpot);
    } catch (err) {
      console.warn('fetchListSpots: Supabase query failed, falling back to local spots', err);
    }
  }

  return readLocalSpots(listId);
}

export async function addSpotToList(
  session: UserSession,
  listId: string,
  place: Place,
  note?: string
): Promise<ListSpot> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to add a spot.');

  if (supabase && !isLocalListId(listId) && !isDemoSession(session)) {
    try {
      const { count, error: countError } = await supabase
        .from('list_spots')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId);
      if (countError) console.warn('addSpotToList: position count query failed, defaulting to 0', countError);
      const { data, error } = await supabase
        .from('list_spots')
        .insert({ list_id: listId, place_id: place.id, place_snapshot: place, note: note ?? null, position: count ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return mapListSpot(data);
    } catch (err) {
      console.warn('addSpotToList: Supabase insert failed, saving spot locally instead', err);
    }
  }

  const existing = readLocalSpots(listId);
  const spot: ListSpot = {
    id: `local-spot-${crypto.randomUUID()}`,
    list_id: listId,
    place_id: place.id,
    place,
    note,
    position: existing.length,
    created_at: new Date().toISOString(),
  };
  saveLocalSpot(spot);
  return spot;
}

/** Surfaces a curator's local-only lists (demo session, or an offline write fallback)
 * in the map's "Curated by Creators" strip — those spots never reach Supabase's
 * `list_spots`/`creator_picks`, so the strip can't see them any other way. */
export function deriveLocalCreatorPicks(creator: Creator): CreatorPick[] {
  return readLocalLists(creator.id).flatMap((list) =>
    readLocalSpots(list.id).map((spot) => ({
      id: `local-pick-${spot.id}`,
      creator_id: creator.id,
      creator,
      place_id: spot.place_id,
      place: spot.place,
      personal_note: spot.note || '',
      created_at: spot.created_at,
    }))
  );
}

/** Places shown on the Map tab (map + list toggle): only places some curator has
 * picked (remote + local demo), restricted to the live map categories. `places` is
 * deduped by place id; `picks` is deduped by creator, for the "Curated by Creators" strip. */
async function fetchRemoteCuratorItineraries(): Promise<Itinerary[]> {
  const local = listAllCuratorItineraries();
  if (!supabase) return local;
  try {
    const { data, error } = await supabase.from('curator_itineraries').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    const mapped = (data ?? []).map(mapRemoteItinerary);
    mapped.forEach(upsertItinerary);
    const ids = new Set(mapped.map((i) => i.id));
    return [...mapped, ...local.filter((i) => !ids.has(i.id))];
  } catch (err) {
    console.warn('fetchRemoteCuratorItineraries failed', err);
    return local;
  }
}

export async function fetchCuratedMapData(session: UserSession): Promise<{ places: Place[]; picks: CreatorPick[] }> {
  const places = allSpotsAsPlaces();
  const itineraries = await fetchRemoteCuratorItineraries();
  const picks: CreatorPick[] = [];
  const seen = new Set<string>();

  for (const itn of itineraries) {
    if (!itn.curatorId || seen.has(itn.curatorId)) continue;
    seen.add(itn.curatorId);
    const creator =
      (await fetchCuratorById(itn.curatorId)) ?? mockCreators.find((c) => c.id === itn.curatorId);
    if (!creator) continue;
    const firstSpotId = itn.days.flatMap((d) => d.blocks).find((b) => b.spotId)?.spotId;
    const spot = firstSpotId ? getSpot(firstSpotId) : undefined;
    const place = spot ? spotToPlace(spot) : places[0];
    if (!place) continue;
    picks.push({
      id: `itn-pick-${itn.id}`,
      creator_id: creator.id,
      creator,
      place_id: place.id,
      place,
      personal_note: itn.title,
      created_at: itn.createdAt,
    });
  }

  if (session.creator && !seen.has(session.creator.id)) {
    const local = listCuratorItineraries(session.creator.id);
    if (local[0]) {
      const firstSpotId = local[0].days.flatMap((d) => d.blocks).find((b) => b.spotId)?.spotId;
      const spot = firstSpotId ? getSpot(firstSpotId) : undefined;
      const place = spot ? spotToPlace(spot) : places[0];
      if (place) {
        picks.push({
          id: `itn-pick-${local[0].id}`,
          creator_id: session.creator.id,
          creator: session.creator,
          place_id: place.id,
          place,
          personal_note: local[0].title,
          created_at: local[0].createdAt,
        });
      }
    }
  }

  return { places, picks };
}

export async function removeSpotFromList(session: UserSession, listId: string, spotId: string): Promise<void> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to remove a spot.');
  if (isLocalListId(listId) || spotId.startsWith('local-spot-')) {
    removeLocalSpot(listId, spotId);
    return;
  }
  if (!supabase) throw new Error('Unable to remove spot.');
  const { error } = await supabase.from('list_spots').delete().eq('id', spotId).eq('list_id', listId);
  if (error) throw error;
}

export async function fetchItineraryById(id: string): Promise<Itinerary | null> {
  const local = getStoredItinerary(id);
  if (local) return local;
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('curator_itineraries').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const mapped = mapRemoteItinerary(data);
    upsertItinerary(mapped);
    return mapped;
  } catch {
    return null;
  }
}

export async function fetchCuratorItineraries(curatorId: string): Promise<Itinerary[]> {
  const local = listCuratorItineraries(curatorId);
  if (!supabase || curatorId.startsWith('local-creator-') || curatorId.startsWith('creator-')) {
    return local;
  }
  try {
    const { data, error } = await supabase
      .from('curator_itineraries')
      .select('*')
      .eq('curator_id', curatorId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data?.length) return local;
    const mapped = data.map(mapRemoteItinerary);
    mapped.forEach(upsertItinerary);
    return mapped;
  } catch {
    return local;
  }
}

export async function createCuratorItinerary(session: UserSession, title: string): Promise<Itinerary> {
  if (!session.isLoggedIn || !session.creator) throw new Error('Must be a curator to create an itinerary.');
  const blank = createBlankItinerary(session.creator.id, title);

  if (supabase && !session.creator.id.startsWith('local-creator-') && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('curator_itineraries')
        .insert({
          curator_id: session.creator.id,
          title: blank.title,
          description: blank.description ?? null,
          days: blank.days,
          estimated_spend_usd: 0,
        })
        .select()
        .single();
      if (error) throw error;
      const mapped = mapRemoteItinerary(data);
      upsertItinerary(mapped);
      return mapped;
    } catch (err) {
      console.warn('createCuratorItinerary: saving locally', err);
    }
  }

  upsertItinerary(blank);
  return blank;
}

export async function updateCuratorItinerary(session: UserSession, itinerary: Itinerary): Promise<void> {
  upsertItinerary(itinerary);
  if (!session.creator || itinerary.id.startsWith('itn_seed_') || itinerary.id.startsWith('snap_')) return;
  if (!supabase || session.creator.id.startsWith('local-creator-') || isDemoSession(session)) return;
  await supabase
    .from('curator_itineraries')
    .update({
      title: itinerary.title,
      description: itinerary.description ?? null,
      days: itinerary.days,
      estimated_spend_usd: itinerary.estimatedSpendUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itinerary.id)
    .eq('curator_id', session.creator.id);
}

export async function deleteCuratorItinerary(session: UserSession, itineraryId: string): Promise<void> {
  removeItinerary(itineraryId);
  if (!session.creator) return;
  if (!supabase || itineraryId.startsWith('itn_seed_') || itineraryId.startsWith('snap_') || isDemoSession(session)) {
    return;
  }
  await supabase.from('curator_itineraries').delete().eq('id', itineraryId).eq('curator_id', session.creator.id);
}

function mapRemoteItinerary(row: {
  id: string;
  curator_id: string;
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
    source: 'curator',
    curatorId: row.curator_id,
    days: row.days ?? [],
    estimatedSpendUsd: row.estimated_spend_usd ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    description: row.description ?? undefined,
  };
}
