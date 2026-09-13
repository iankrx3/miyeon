import { useCallback, useEffect, useState } from 'react';

// "Save to My Map" — the MIYEON Core UX spec §3. Stored client-side for now;
// once user accounts persist server-side, swap this for a `saved_places` table
// keyed by session.user.id and keep the same hook signature. Scoped per-user
// (like `savedKeyFor` in localItineraryStore.ts) so switching accounts on the
// same browser doesn't leak one user's saved pins into another's.
function storageKeyFor(userId?: string): string {
  return `miyeon_my_map:${userId ?? 'guest'}`;
}

function readSaved(userId?: string): string[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useSavedPlaces(userId?: string) {
  const [savedIds, setSavedIds] = useState<string[]>(() => readSaved(userId));

  useEffect(() => {
    setSavedIds(readSaved(userId));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(savedIds));
  }, [savedIds, userId]);

  const isSaved = useCallback((placeId: string) => savedIds.includes(placeId), [savedIds]);

  const toggleSave = useCallback((placeId: string) => {
    setSavedIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  }, []);

  return { savedIds, isSaved, toggleSave };
}
