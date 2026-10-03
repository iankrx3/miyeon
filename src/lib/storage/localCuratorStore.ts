import type { Creator, CuratorList, ListSpot, UserSession } from '../../types';

// Fallback persistence for curator writes when Supabase isn't configured, or a write
// fails (e.g. the demo session's user id isn't a real auth.users row). Mirrors
// lib/storage/localCommunityStore.ts's localStorage pattern.
const CURATORS_KEY = 'miyeon_local_curators'; // Record<userId, Creator>
const LISTS_KEY = 'miyeon_local_lists'; // Record<curatorId, CuratorList[]>
const SPOTS_KEY = 'miyeon_local_list_spots'; // Record<listId, ListSpot[]>

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — write still applies for this tab's in-memory state
  }
}

export function readLocalCuratorByUserId(userId: string): Creator | null {
  const all = readJson<Record<string, Creator>>(CURATORS_KEY, {});
  return all[userId] ?? null;
}

export function readLocalCuratorById(id: string): Creator | null {
  const all = readJson<Record<string, Creator>>(CURATORS_KEY, {});
  return Object.values(all).find((c) => c.id === id) ?? null;
}

export function saveLocalCurator(creator: Creator) {
  const all = readJson<Record<string, Creator>>(CURATORS_KEY, {});
  all[creator.user_id] = creator;
  writeJson(CURATORS_KEY, all);
}

/** Attaches a locally-created curator profile onto a session that doesn't already have one. */
export function mergeLocalCreator(session: UserSession): UserSession {
  if (!session.isLoggedIn || !session.user || session.creator) return session;
  const local = readLocalCuratorByUserId(session.user.id);
  return local ? { ...session, creator: local } : session;
}

export function readLocalLists(curatorId: string): CuratorList[] {
  const all = readJson<Record<string, CuratorList[]>>(LISTS_KEY, {});
  return all[curatorId] ?? [];
}

export function saveLocalList(list: CuratorList) {
  const all = readJson<Record<string, CuratorList[]>>(LISTS_KEY, {});
  all[list.curator_id] = [...(all[list.curator_id] ?? []), list];
  writeJson(LISTS_KEY, all);
}

export function findLocalListById(listId: string): CuratorList | null {
  const all = readJson<Record<string, CuratorList[]>>(LISTS_KEY, {});
  for (const lists of Object.values(all)) {
    const found = lists.find((l) => l.id === listId);
    if (found) return found;
  }
  return null;
}

export function readLocalSpots(listId: string): ListSpot[] {
  const all = readJson<Record<string, ListSpot[]>>(SPOTS_KEY, {});
  return all[listId] ?? [];
}

function bumpLocalListSpotCount(listId: string, delta: number) {
  const all = readJson<Record<string, CuratorList[]>>(LISTS_KEY, {});
  for (const curatorId of Object.keys(all)) {
    all[curatorId] = all[curatorId].map((l) =>
      l.id === listId ? { ...l, spot_count: Math.max(0, l.spot_count + delta) } : l
    );
  }
  writeJson(LISTS_KEY, all);
}

export function saveLocalSpot(spot: ListSpot) {
  const all = readJson<Record<string, ListSpot[]>>(SPOTS_KEY, {});
  all[spot.list_id] = [...(all[spot.list_id] ?? []), spot];
  writeJson(SPOTS_KEY, all);
  bumpLocalListSpotCount(spot.list_id, 1);
}
