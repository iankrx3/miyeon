/** IDs the user deleted this device, so a stale cloud hydrate cannot resurrect them. */

function storageKey(kind: string, userId?: string): string {
  return `miyeon_deleted_${kind}:${userId ?? 'guest'}`;
}

function read(kind: string, userId?: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(kind, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function write(kind: string, userId: string | undefined, ids: string[]) {
  localStorage.setItem(storageKey(kind, userId), JSON.stringify([...new Set(ids)]));
}

export function listTombstones(kind: string, userId?: string): Set<string> {
  return new Set(read(kind, userId));
}

export function addTombstone(kind: string, userId: string | undefined, id: string) {
  write(kind, userId, [...read(kind, userId), id]);
}

export function addTombstones(kind: string, userId: string | undefined, ids: string[]) {
  write(kind, userId, [...read(kind, userId), ...ids]);
}

export function removeTombstone(kind: string, userId: string | undefined, id: string) {
  write(
    kind,
    userId,
    read(kind, userId).filter((item) => item !== id)
  );
}

export const TOMBSTONE_PLACES = 'places';
export const TOMBSTONE_SAVED_ITINERARIES = 'saved_itineraries';
export const TOMBSTONE_USER_ITINERARIES = 'user_itineraries';
