import React, { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import type { Place } from '../../types';
import { fetchPlaces } from '../../services/places';
import { searchPlacesByCategory } from '../../services/discovery';
import { ENABLED_MAP_CATEGORIES } from '../../data/mapCategories';

interface PlaceSearchPickerProps {
  onSelect: (place: Place) => void;
  onClose?: () => void;
}

/**
 * Extracted from MapView's search box (local instant matches + a 350ms
 * debounced live Google Places search) so it can be reused anywhere a place
 * needs to be picked — e.g. adding a spot to a curator list.
 */
export const PlaceSearchPicker: React.FC<PlaceSearchPickerProps> = ({ onSelect, onClose }) => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaces().then(setAllPlaces);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const q = query.toLowerCase();
    const local = allPlaces.filter((p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q));
    setResults(local.slice(0, 8));

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const live = await searchPlacesByCategory(ENABLED_MAP_CATEGORIES, query);
        if (cancelled) return;
        const seen = new Set(local.map((p) => p.id));
        setResults([...local, ...live.filter((p) => !seen.has(p.id))].slice(0, 8));
      } catch {
        // fail-silent — local matches (already shown) are still valid
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, allPlaces]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-full border border-miyeon-line bg-white px-3.5 py-2">
        <Search className="h-4 w-4 shrink-0 text-miyeon-main/60" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place by name…"
          className="w-full bg-transparent text-sm text-miyeon-main placeholder:text-miyeon-main/60 focus:outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-miyeon-main/60" />}
        {onClose && (
          <button onClick={onClose} aria-label="Close search">
            <X className="h-4 w-4 text-miyeon-main/60" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => onSelect(place)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-miyeon-line bg-white p-2 text-left hover:border-miyeon-accent/50"
            >
              <img src={place.photoUrl} alt={place.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-miyeon-main">{place.name}</p>
                <p className="truncate text-xs text-miyeon-main/70">{place.area}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
