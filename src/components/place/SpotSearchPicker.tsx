import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Spot } from '../../types';
import { getSpots, placeToSpot, SUBCATEGORY_LABEL } from '../../data/spots';
import { searchPlacesByCategory } from '../../services/discovery';
import { ENABLED_MAP_CATEGORIES } from '../../data/mapCategories';

interface SpotSearchPickerProps {
  onSelect: (spot: Spot) => void;
  onClose?: () => void;
  excludeIds?: string[];
}

export const SpotSearchPicker: React.FC<SpotSearchPickerProps> = ({ onSelect, onClose, excludeIds = [] }) => {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getSpots()
      .filter((s) => !excluded.has(s.id))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          SUBCATEGORY_LABEL[s.subcategory].toLowerCase().includes(q)
        );
      });
  }, [query, excluded]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setLiveResults([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlacesByCategory(ENABLED_MAP_CATEGORIES, q);
        if (cancelled) return;
        setLiveResults(places.map(placeToSpot));
      } catch {
        // fail-silent — locally cached matches (already shown) are still valid
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo(() => {
    const seen = new Set<string>();
    const merged: Spot[] = [];
    for (const spot of [...localResults, ...liveResults]) {
      if (excluded.has(spot.id) || seen.has(spot.id)) continue;
      seen.add(spot.id);
      merged.push(spot);
    }
    return merged.slice(0, 12);
  }, [localResults, liveResults, excluded]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-full border border-miyeon-neutral bg-white px-3.5 py-2">
        <Search className="h-4 w-4 shrink-0 text-miyeon-main/60" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or area…"
          className="w-full bg-transparent text-sm text-miyeon-main placeholder:text-miyeon-main/60 focus:outline-none"
        />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close search">
            <X className="h-4 w-4 text-miyeon-main/60" />
          </button>
        )}
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {results.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => onSelect(spot)}
            className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-miyeon-neutral"
          >
            <img src={spot.images[0]} alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span>
              <span className="block text-sm font-semibold text-miyeon-main">{spot.name}</span>
              <span className="block text-[11px] text-miyeon-main/60">
                {spot.area} · {SUBCATEGORY_LABEL[spot.subcategory]} · ${spot.priceMin}–{spot.priceMax}
              </span>
            </span>
          </button>
        ))}
        {isLoading && <p className="px-2 py-1 text-xs text-miyeon-main/50">Searching…</p>}
      </div>
    </div>
  );
};
