import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ItineraryDay, Spot } from '../../types';
import { getSpot } from '../../data/spots';

interface ItineraryRouteMapProps {
  day: ItineraryDay | undefined;
  onSelectSpot?: (spot: Spot) => void;
}

function addBasemap(map: L.Map) {
  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const voyager = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const layer = maptilerKey
    ? L.tileLayer(`https://api.maptiler.com/maps/dataviz-v4/256/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 19,
        crossOrigin: true,
      })
    : L.tileLayer(voyager, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      });
  layer.on('tileerror', () => layer.setUrl(voyager));
  layer.addTo(map);
}

export const ItineraryRouteMap: React.FC<ItineraryRouteMapProps> = ({ day, onSelectSpot }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [37.55, 126.99],
      zoom: 13,
      zoomControl: false,
    });
    addBasemap(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!day) return;

    const spots = day.blocks
      .filter((b) => b.kind === 'spot' && b.spotId)
      .map((b) => getSpot(b.spotId!))
      .filter((s): s is Spot => Boolean(s));

    if (spots.length === 0) return;

    const latlngs = spots.map((s) => [s.latitude, s.longitude] as [number, number]);
    L.polyline(latlngs, { color: '#d49a9a', weight: 3, opacity: 0.9 }).addTo(layer);

    spots.forEach((spot, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:999px;background:#5a514d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.2)">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([spot.latitude, spot.longitude], { icon }).addTo(layer);
      marker.on('click', () => onSelectSpot?.(spot));
    });

    if (spots.length === 1) {
      map.setView([spots[0].latitude, spots[0].longitude], 15);
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 16 });
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [day, onSelectSpot]);

  return <div ref={containerRef} className="h-full min-h-[240px] w-full" />;
};
