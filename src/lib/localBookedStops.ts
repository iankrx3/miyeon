// Which plan stops the user has marked as booked. There's no booking data (bookings
// happen on Creatrip), so "Booked" on the profile's plan card is a self-reported tick.
const BOOKED_KEY = 'miyeon_booked_stops';

export function readBookedStops(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Flips one stop and returns the updated set. */
export function toggleBookedStop(blockId: string): Set<string> {
  const next = readBookedStops();
  if (next.has(blockId)) next.delete(blockId);
  else next.add(blockId);
  try {
    localStorage.setItem(BOOKED_KEY, JSON.stringify([...next]));
  } catch {
    // private mode / quota — the in-memory set still reflects the tap
  }
  return next;
}
