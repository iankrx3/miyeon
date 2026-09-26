import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ItineraryDay, Spot } from '../../types';
import { getSpot } from '../../data/spots';
import { addBasemap } from '../../lib/leafletBasemap';

interface ItineraryRouteMapProps {
  day: ItineraryDay | undefined;
  onSelectSpot?: (spot: Spot) => void;
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

    const pins = day.blocks
      .filter((b) => b.kind === 'spot')
      .map((b) => {
        const spot = b.spotId ? getSpot(b.spotId) : undefined;
        const latitude = b.latitude ?? spot?.latitude;
        const longitude = b.longitude ?? spot?.longitude;
        if (latitude == null || longitude == null) return null;
        return { block: b, spot, latitude, longitude };
      })
      .filter((pin): pin is NonNullable<typeof pin> => Boolean(pin));

    if (pins.length === 0) return;

    const latlngs = pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]);
    L.polyline(latlngs, { color: '#d49a9a', weight: 3, opacity: 0.9 }).addTo(layer);

    pins.forEach((pin, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:999px;background:#5a514d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.2)">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([pin.latitude, pin.longitude], { icon }).addTo(layer);
      marker.on('click', () => {
        if (pin.spot) onSelectSpot?.(pin.spot);
      });
    });

    if (pins.length === 1) {
      map.setView([pins[0].latitude, pins[0].longitude], 15);
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 16 });
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [day, onSelectSpot]);

  return <div ref={containerRef} className="h-full min-h-[240px] w-full" />;
};
