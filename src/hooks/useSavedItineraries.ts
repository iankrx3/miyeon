import { useCallback, useEffect, useRef, useState } from 'react';
import type { Itinerary, SavedItinerary } from '../types';
import { isRemoteUser } from '../lib/remoteUser';
import { addTombstones, removeTombstone, TOMBSTONE_SAVED_ITINERARIES } from '../lib/syncTombstones';
import {
  listSavedItineraries,
  migrateGuestSavedItineraries,
  upsertItinerary,
  writeSavedItineraries,
} from '../lib/localItineraryStore';
import {
  deleteRemoteSavedItinerary,
  excludeDeletedSavedItineraries,
  fetchRemoteSavedItineraries,
  insertRemoteSavedItinerary,
  mergeSavedItineraries,
  pushLocalSavedItineraries,
  reconcileDeletedSavedItineraries,
  savedItineraryKeys,
} from '../services/savedItineraries';

export function useSavedItineraries(userId?: string) {
  const [saved, setSaved] = useState<SavedItinerary[]>(() =>
    excludeDeletedSavedItineraries(listSavedItineraries(userId), userId)
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const hydratedUserId = useRef(userId);
  const deletedIds = useRef(new Set<string>());

  useEffect(() => {
    hydratedUserId.current = userId;
    const migrated = excludeDeletedSavedItineraries(migrateGuestSavedItineraries(userId), userId);
    setSaved(migrated);
    setSyncError(null);
    let cancelled = false;
    (async () => {
      const remote = await fetchRemoteSavedItineraries(userId);
      if (cancelled) return;
      if (remote === null) {
        if (isRemoteUser(userId)) setSyncError('Could not sync saved itineraries. Showing this device only.');
        return;
      }
      const localNow = excludeDeletedSavedItineraries(listSavedItineraries(userId), userId);
      const merged = excludeDeletedSavedItineraries(mergeSavedItineraries(localNow, remote), userId).filter(
        (entry) => !savedItineraryKeys(entry).some((id) => deletedIds.current.has(id))
      );
      merged.forEach((entry) => upsertItinerary(entry.snapshot));
      setSaved(merged);
      await reconcileDeletedSavedItineraries(userId, remote);
      if (cancelled) return;
      const pushed = await pushLocalSavedItineraries(userId, merged, remote);
      if (cancelled) return;
      if (!pushed) setSyncError('Could not sync saved itineraries. Showing this device only.');
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (hydratedUserId.current !== userId) return;
    writeSavedItineraries(saved, userId);
  }, [saved, userId]);

  const isSaved = useCallback(
    (itineraryId: string) => saved.some((s) => s.itineraryId === itineraryId || s.snapshot.id === itineraryId),
    [saved]
  );

  const saveItinerary = useCallback(
    (itinerary: Itinerary) => {
      const snapshot: Itinerary = {
        ...(JSON.parse(JSON.stringify(itinerary)) as Itinerary),
        id: `snap_${crypto.randomUUID()}`,
      };
      upsertItinerary(snapshot);
      const entry: SavedItinerary = {
        savedId: snapshot.id,
        itineraryId: itinerary.id,
        source: itinerary.source,
        snapshot,
        savedAt: new Date().toISOString(),
      };
      deletedIds.current.delete(itinerary.id);
      removeTombstone(TOMBSTONE_SAVED_ITINERARIES, userId, itinerary.id);
      setSaved((prev) => [entry, ...prev.filter((s) => s.itineraryId !== itinerary.id)]);
      void insertRemoteSavedItinerary(userId, entry).then((ok) => {
        if (!ok && isRemoteUser(userId)) setSyncError('Could not sync saved itineraries. Showing this device only.');
      });
      return snapshot;
    },
    [userId]
  );

  const updateSavedSnapshot = useCallback(
    (itinerary: Itinerary) => {
      setSaved((prev) => {
        const idx = prev.findIndex(
          (s) => s.itineraryId === itinerary.id || s.snapshot.id === itinerary.id || s.savedId === itinerary.id
        );
        if (idx < 0) return prev;
        const previous = prev[idx];
        const snapshot: Itinerary = {
          ...(JSON.parse(JSON.stringify(itinerary)) as Itinerary),
          id: previous.snapshot.id,
        };
        upsertItinerary(snapshot);
        const entry: SavedItinerary = {
          ...previous,
          snapshot,
          savedAt: new Date().toISOString(),
        };
        void insertRemoteSavedItinerary(userId, entry);
        const next = [...prev];
        next[idx] = entry;
        return next;
      });
    },
    [userId]
  );

  const unsave = useCallback(
    (itineraryId: string) => {
      const entry = saved.find(
        (s) => s.itineraryId === itineraryId || s.snapshot.id === itineraryId || s.savedId === itineraryId
      );
      const keys = [itineraryId, ...(entry ? savedItineraryKeys(entry) : [])];
      keys.forEach((id) => deletedIds.current.add(id));
      addTombstones(TOMBSTONE_SAVED_ITINERARIES, userId, keys);
      setSaved((prev) =>
        prev.filter((s) => s.itineraryId !== itineraryId && s.snapshot.id !== itineraryId && s.savedId !== itineraryId)
      );
      void deleteRemoteSavedItinerary(userId, {
        itineraryId: entry?.itineraryId ?? itineraryId,
        savedId: entry?.savedId,
        snapshotId: entry?.snapshot.id,
      }).then((ok) => {
        if (!ok && isRemoteUser(userId)) {
          setSyncError('Could not delete from the cloud. It may reappear on another device.');
        }
      });
    },
    [saved, userId]
  );

  const toggleSave = useCallback(
    (itinerary: Itinerary) => {
      if (isSaved(itinerary.id)) unsave(itinerary.id);
      else saveItinerary(itinerary);
    },
    [isSaved, saveItinerary, unsave]
  );

  return { saved, isSaved, saveItinerary, unsave, toggleSave, updateSavedSnapshot, syncError };
}
