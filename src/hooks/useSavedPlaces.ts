import { useCallback, useEffect, useRef, useState } from 'react';
import type { Place } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { addTombstone, removeTombstone, TOMBSTONE_PLACES } from '../lib/syncTombstones';
import { fetchPlaceById } from '../services/places';
import {
  deleteRemoteSavedPlace,
  excludeDeletedPlaces,
  fetchRemoteSavedPlaces,
  insertRemoteSavedPlace,
  mergeSaved,
  pushLocalSavedPlaces,
  reconcileDeletedPlaces,
  type SavedPlaceEntry,
} from '../services/savedPlaces';

function storageKeyFor(userId?: string): string {
  return `miyeon_my_map:${userId ?? 'guest'}`;
}

function readSaved(userId?: string): SavedPlaceEntry[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return (parsed as string[]).map((placeId) => ({
        placeId,
        snapshot: { id: placeId } as Place,
        savedAt: new Date().toISOString(),
      }));
    }
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is SavedPlaceEntry => Boolean(item?.placeId && item?.snapshot));
    }
    return [];
  } catch {
    return [];
  }
}

function writeSaved(userId: string | undefined, entries: SavedPlaceEntry[]) {
  localStorage.setItem(storageKeyFor(userId), JSON.stringify(entries));
}

function migrateGuestSavedPlaces(userId?: string): SavedPlaceEntry[] {
  const current = readSaved(userId);
  if (!userId) return current;
  const guest = readSaved(undefined);
  if (guest.length === 0) return current;
  const merged = mergeSaved(guest, current);
  writeSaved(userId, merged);
  localStorage.removeItem(storageKeyFor(undefined));
  return merged;
}

export function useSavedPlaces(userId?: string) {
  const [saved, setSaved] = useState<SavedPlaceEntry[]>(() => excludeDeletedPlaces(readSaved(userId), userId));
  const [syncError, setSyncError] = useState<string | null>(null);
  const hydratedUserId = useRef(userId);

  useEffect(() => {
    hydratedUserId.current = userId;
    const migrated = excludeDeletedPlaces(migrateGuestSavedPlaces(userId), userId);
    setSaved(migrated);
    setSyncError(null);
    let cancelled = false;
    (async () => {
      const remote = await fetchRemoteSavedPlaces(userId);
      if (cancelled) return;
      if (remote === null) {
        if (isRemoteUser(userId)) setSyncError('Could not sync saved places. Showing this device only.');
        return;
      }
      const localNow = excludeDeletedPlaces(readSaved(userId), userId);
      const merged = excludeDeletedPlaces(mergeSaved(localNow, remote), userId);
      setSaved(merged);
      await reconcileDeletedPlaces(userId, remote);
      if (cancelled) return;
      const pushed = await pushLocalSavedPlaces(userId, merged, remote);
      if (cancelled) return;
      if (!pushed) setSyncError('Could not sync saved places. Showing this device only.');
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (hydratedUserId.current !== userId) return;
    writeSaved(userId, saved);
  }, [saved, userId]);

  const attemptedHydrate = useRef(new Set<string>());
  useEffect(() => {
    const missing = saved.filter((entry) => !entry.snapshot?.name && !attemptedHydrate.current.has(entry.placeId));
    if (missing.length === 0) return;
    missing.forEach((entry) => attemptedHydrate.current.add(entry.placeId));
    let cancelled = false;
    Promise.all(missing.map((entry) => fetchPlaceById(entry.placeId))).then((places) => {
      if (cancelled) return;
      setSaved((prev) =>
        prev.map((entry) => {
          const found = places.find((place) => place?.id === entry.placeId);
          return found ? { ...entry, snapshot: found } : entry;
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, [saved]);

  const isSaved = useCallback((placeId: string) => saved.some((entry) => entry.placeId === placeId), [saved]);

  const savePlace = useCallback(
    (place: Place) => {
      const entry: SavedPlaceEntry = {
        placeId: place.id,
        snapshot: place,
        savedAt: new Date().toISOString(),
      };
      removeTombstone(TOMBSTONE_PLACES, userId, place.id);
      setSaved((prev) => [entry, ...prev.filter((item) => item.placeId !== place.id)]);
      void insertRemoteSavedPlace(userId, entry).then((ok) => {
        if (!ok && isRemoteUser(userId)) setSyncError('Could not sync saved places. Showing this device only.');
      });
    },
    [userId]
  );

  const unsave = useCallback(
    (placeId: string) => {
      addTombstone(TOMBSTONE_PLACES, userId, placeId);
      setSaved((prev) => prev.filter((item) => item.placeId !== placeId));
      void deleteRemoteSavedPlace(userId, placeId).then((ok) => {
        if (!ok && isRemoteUser(userId)) {
          setSyncError('Could not delete from the cloud. It may reappear on another device.');
        }
      });
    },
    [userId]
  );

  const toggleSave = useCallback(
    (place: Place) => {
      if (isSaved(place.id)) unsave(place.id);
      else savePlace(place);
    },
    [isSaved, savePlace, unsave]
  );

  const savedIds = saved.map((entry) => entry.placeId);
  const savedPlaces = saved.map((entry) => entry.snapshot).filter((place) => Boolean(place?.name));

  return { savedIds, savedPlaces, saved, isSaved, toggleSave, unsave, syncError };
}
