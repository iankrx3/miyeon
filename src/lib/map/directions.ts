import type { Place } from '../../types';

export interface DirectionsLink {
  provider: 'google' | 'naver' | 'kakao';
  label: string;
  url: string;
}

/**
 * Get-directions links for a Place. Google and Kakao support coordinate-based
 * "start navigation now" links with no API key. Naver does not publish a
 * stable web URL that pre-fills a route from coordinates alone (only the
 * `nmap://` app scheme does) — so its link opens a place search instead, one
 * tap short of a route.
 */
export function getDirectionsLinks(place: Place): DirectionsLink[] {
  const { name, latitude, longitude, googlePlaceId } = place;
  const coords = `${latitude},${longitude}`;

  const googleUrl = new URL('https://www.google.com/maps/dir/');
  googleUrl.searchParams.set('api', '1');
  googleUrl.searchParams.set('destination', googlePlaceId ? name : coords);
  if (googlePlaceId) googleUrl.searchParams.set('destination_place_id', googlePlaceId);

  return [
    { provider: 'google', label: 'Google Maps', url: googleUrl.toString() },
    { provider: 'naver', label: 'Naver Map', url: `https://map.naver.com/p/search/${encodeURIComponent(name)}` },
    { provider: 'kakao', label: 'Kakao Map', url: `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}` },
  ];
}
