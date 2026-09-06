import type { Spot, TravelMode } from '../../types';

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function travelBetween(a: Spot, b: Spot): { mode: TravelMode; minutes: number } {
  const km = haversineKm(a, b);
  if (km < 0.85) return { mode: 'walk', minutes: Math.max(4, Math.round(km * 13)) };
  if (km < 4.5) return { mode: 'subway', minutes: Math.round(10 + km * 4) };
  return { mode: 'taxi', minutes: Math.round(8 + km * 3.2) };
}
