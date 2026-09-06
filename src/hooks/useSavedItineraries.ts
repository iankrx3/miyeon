import { useCallback, useEffect, useState } from 'react';
import type { Itinerary, SavedItinerary } from '../types';
import { listSavedItineraries, upsertItinerary, writeSavedItineraries } from '../lib/localItineraryStore';

export function useSavedItineraries(userId?: string) {
  const [saved, setSaved] = useState<SavedItinerary[]>(() => listSavedItineraries(userId));

  useEffect(() => {
    setSaved(listSavedItineraries(userId));
  }, [userId]);

  useEffect(() => {
    writeSavedItineraries(saved, userId);
  }, [saved, userId]);

  const isSaved = useCallback(
    (itineraryId: string) => saved.some((s) => s.itineraryId === itineraryId || s.snapshot.id === itineraryId),
    [saved]
  );

  const saveItinerary = useCallback((itinerary: Itinerary) => {
    const snapshot: Itinerary = {
      ...JSON.parse(JSON.stringify(itinerary)) as Itinerary,
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
    setSaved((prev) => [entry, ...prev.filter((s) => s.itineraryId !== itinerary.id)]);
    return snapshot;
  }, []);

  const unsave = useCallback((itineraryId: string) => {
    setSaved((prev) =>
      prev.filter((s) => s.itineraryId !== itineraryId && s.snapshot.id !== itineraryId && s.savedId !== itineraryId)
    );
  }, []);

  const toggleSave = useCallback(
    (itinerary: Itinerary) => {
      if (isSaved(itinerary.id)) unsave(itinerary.id);
      else saveItinerary(itinerary);
    },
    [isSaved, saveItinerary, unsave]
  );

  return { saved, isSaved, saveItinerary, unsave, toggleSave };
}
