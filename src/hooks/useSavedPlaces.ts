import { useCallback, useEffect, useRef, useState } from 'react';
import type { Place } from '../types';
import { fetchPlaceById } from '../services/places';
import {
  deleteRemoteSavedPlace,
  fetchRemoteSavedPlaces,
  insertRemoteSavedPlace,
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

function mergeSaved(local: SavedPlaceEntry[], remote: SavedPlaceEntry[]): SavedPlaceEntry[] {
  const byId = new Map<string, SavedPlaceEntry>();
  for (const entry of local) byId.set(entry.placeId, entry);
  for (const entry of remote) byId.set(entry.placeId, entry);
  return [...byId.values()].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function useSavedPlaces(userId?: string) {
  const [saved, setSaved] = useState<SavedPlaceEntry[]>(() => readSaved(userId));
  const hydratedUserId = useRef(userId);

  useEffect(() => {
    hydratedUserId.current = userId;
    setSaved(readSaved(userId));
    let cancelled = false;
    fetchRemoteSavedPlaces(userId).then((remote) => {
      if (cancelled || !remote) return;
      setSaved((local) => mergeSaved(local, remote));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (hydratedUserId.current !== userId) return;
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(saved));
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
      setSaved((prev) => [entry, ...prev.filter((item) => item.placeId !== place.id)]);
      void insertRemoteSavedPlace(userId, entry);
    },
    [userId]
  );

  const unsave = useCallback(
    (placeId: string) => {
      setSaved((prev) => prev.filter((item) => item.placeId !== placeId));
      void deleteRemoteSavedPlace(userId, placeId);
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

  return { savedIds, savedPlaces, isSaved, toggleSave, unsave };
}
