import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GlowUpRoutine } from '../../types';
import { addBasemap } from '../../lib/leafletBasemap';

interface RoutineMapProps {
  routines: GlowUpRoutine[];
  activeId: string;
  onSelectRoutine: (routineId: string) => void;
  onOpenStop?: (routineId: string, stopId: string) => void;
}

const ACTIVE = '#E2637F';

function pinIcon(label: string, active: boolean): L.DivIcon {
  const size = active ? 28 : 20;
  const style = active
    ? `background:${ACTIVE};color:#fff;border:2px solid #fff;box-shadow:0 2px 8px rgba(207,63,97,.35);font-size:12px`
    : 'background:#fff;color:#8a7f7a;border:1.5px solid #d8d0cd;box-shadow:0 1px 4px rgba(0,0,0,.12);font-size:10px';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:700;${style}">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Result-page map: one pin per recommended venue, the selected routine highlighted with its
 * route; tapping another routine's pin selects that routine. */
export const RoutineMap: React.FC<RoutineMapProps> = ({ routines, activeId, onSelectRoutine, onOpenStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const cbRef = useRef({ onSelectRoutine, onOpenStop });
  cbRef.current = { onSelectRoutine, onOpenStop };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [37.5665, 126.978], zoom: 12, zoomControl: false, attributionControl: true });
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

    const withCoords = (r: GlowUpRoutine) => r.stops.filter((s) => s.place.lat != null && s.place.lng != null);
    const latlng = (s: GlowUpRoutine['stops'][number]) => [s.place.lat as number, s.place.lng as number] as [number, number];

    // Inactive routines first so the active one draws on top.
    const ordered = [...routines].sort((a, b) => Number(a.id === activeId) - Number(b.id === activeId));
    for (const routine of ordered) {
      const active = routine.id === activeId;
      const stops = withCoords(routine);
      if (stops.length > 1 && active) {
        L.polyline(stops.map(latlng), { color: ACTIVE, weight: 3, opacity: 0.85, dashArray: '2 7', lineCap: 'round' }).addTo(layer);
      }
      stops.forEach((stop, i) => {
        const marker = L.marker(latlng(stop), {
          icon: pinIcon(String(i + 1), active),
          zIndexOffset: active ? 1000 : 0,
          title: stop.place.name,
        }).addTo(layer);
        marker.on('click', () => {
          if (active) cbRef.current.onOpenStop?.(routine.id, stop.id);
          else cbRef.current.onSelectRoutine(routine.id);
        });
      });
    }

    const active = routines.find((r) => r.id === activeId);
    const pts = (active ? withCoords(active) : routines.flatMap(withCoords)).map(latlng);
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16 });
    requestAnimationFrame(() => map.invalidateSize());
  }, [routines, activeId]);

  const places = new Set(routines.flatMap((r) => r.stops.map((s) => s.place.id))).size;

  return (
    <div className="relative h-[300px] w-full bg-[#e8e4df]">
      <div ref={containerRef} className="h-full w-full" />
      <span className="pointer-events-none absolute left-4 top-4 z-[500] rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-miyeon-ink shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        {places} place{places === 1 ? '' : 's'} · {routines.length} routine{routines.length === 1 ? '' : 's'}
      </span>
    </div>
  );
};
