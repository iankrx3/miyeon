import { useEffect, useState } from 'react';
import { loadSpots } from '../data/spots';

/** Loads the live spot catalog (KTO/Google discovery) on demand. Itinerary and
 * the curator editor call this. The map does not: fetchCuratedMapData loads the
 * catalog in parallel with its own queries and must not block the map shell.
 * loadSpots() fans out to external APIs, so it must not run at app boot.
 * It is memoized, so calling it from several pages still hits the network once. */
export function useSpotsCatalog(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadSpots().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return ready;
}
