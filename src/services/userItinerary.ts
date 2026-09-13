import type { Itinerary, UserSession } from '../types';
import { createBlankItinerary } from './itinerary/generate';
import { removeItinerary, upsertItinerary } from '../lib/localItineraryStore';

/** Lets any logged-in user (not just curators) build their own real-place
 * itinerary. Local-storage only, by design: the `curator_itineraries` Supabase
 * table's RLS ties ownership to the `creators` table via a join (see
 * supabase/itineraries_schema.sql), so a non-curator has no row to write
 * against without a schema/RLS migration. This matches the app's existing
 * fallback pattern for offline/demo writes elsewhere in services/curator.ts. */
export function createUserItinerary(session: UserSession, title: string): Itinerary {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to create an itinerary.');
  const blank = createBlankItinerary(session.user.id, title, 'user');
  upsertItinerary(blank);
  return blank;
}

export function deleteUserItinerary(itineraryId: string): void {
  removeItinerary(itineraryId);
}
