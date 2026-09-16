import { useEffect, useState } from 'react';
import { loadSpots } from '../data/spots';

/** Loads the live spot catalog (KTO/Google discovery) on demand. Only pages that
 * actually read getSpot()/getSpots() (Map, Itinerary, Curator itinerary editor)
 * should call this — it fans out to a burst of external API calls, so it must not
 * run until one of those pages actually mounts. loadSpots() is memoized, so calling
 * this from multiple pages is safe/cheap once the first call resolves. */
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
