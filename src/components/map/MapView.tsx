import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Locate, Loader2, Search, X, ChevronRight, ChevronDown, Plus, Minus } from 'lucide-react';
import type { BeautyCategory, Creator, CreatorPick, Place, UserSession } from '../../types';
import { categoryMeta } from '../../data/mock';
import { ENABLED_MAP_CATEGORIES } from '../../data/mapCategories';
import { searchPlacesByCategory } from '../../services/discovery';
import {
  fetchCuratedMapData,
  fetchCuratorById,
  fetchCuratorItineraries,
} from '../../services/curator';
import { listAllCuratorItineraries } from '../../lib/localItineraryStore';
import { useSavedItineraries } from '../../hooks/useSavedItineraries';
import type { Itinerary } from '../../types';

// Adapted from extract/src/components/MapView.tsx (Sniffood map + login kit).
// Same Leaflet/MapTiler setup and custom controls; filter modes and pin data
// swapped from restaurant curators to Miyeon's beauty Place/Category model
// (§3 MAP) plus a KTO Wellness pin layer (§7.2 use case ②, deferred to V1
// in the PRD but wired here since the data shape already supports it).

interface MapViewProps {
  onSelectPlace: (place: Place) => void;
  session: UserSession;
  /** Whether this MapView is the currently visible tab (vs. hidden via CSS while List view is active). */
  visible?: boolean;
}

type FilterMode = 'category' | 'picks';
type PickFilter = 'all' | 'ai' | 'creator' | 'community';

const CATEGORY_FILTERS: { id: 'all' | BeautyCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'skin', label: '✨ Skin' },
  { id: 'face', label: '💎 Face' },
  { id: 'hair', label: '✂️ Hair' },
  { id: 'nails', label: '💅 Nails' },
  { id: 'makeup', label: '💄 Makeup' },
];

const PICK_FILTERS: { id: PickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI Picks' },
  { id: 'creator', label: 'Creator Picks' },
  { id: 'community', label: 'Community Picks' },
];

/** Pans/zooms the map so `targets` are fully visible — a single flyTo for one place,
 * or a padded flyToBounds for several (padded so the top search/filter UI never covers a pin). */
function fitMapToPlaces(map: L.Map, targets: Place[]) {
  if (targets.length === 0) return;
  if (targets.length === 1) {
    map.flyTo([targets[0].latitude, targets[0].longitude], 16, { animate: true, duration: 1 });
    return;
  }
  const bounds = L.latLngBounds(targets.map((p) => [p.latitude, p.longitude] as [number, number]));
  map.flyToBounds(bounds, {
    paddingTopLeft: [40, 140],
    paddingBottomRight: [40, 100],
    maxZoom: 16,
    animate: true,
    duration: 1,
  });
}

export const MapView: React.FC<MapViewProps> = ({ onSelectPlace, session, visible = true }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const wellnessLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [places, setPlaces] = useState<Place[]>([]);
  const [creatorPicks, setCreatorPicks] = useState<CreatorPick[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMode, setFilterMode] = useState<FilterMode>('category');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BeautyCategory>('all');
  const [selectedPick, setSelectedPick] = useState<PickFilter>('all');
  const [isCreatorPicksExpanded, setIsCreatorPicksExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const curatorIdParam = searchParams.get('curator');
  const itineraryIdParam = searchParams.get('itinerary') || searchParams.get('list');
  const curatorFilterActive = Boolean(curatorIdParam || itineraryIdParam);
  const { saved } = useSavedItineraries(session.user?.id);
  const [itineraryPicker, setItineraryPicker] = useState<Itinerary[] | null>(null);
  const [curatorFilterPlaces, setCuratorFilterPlaces] = useState<Place[]>([]);
  const [curatorFilterCreator, setCuratorFilterCreator] = useState<Creator | null>(null);
  const [curatorFilterListTitle, setCuratorFilterListTitle] = useState<string | null>(null);

  // "View this curator/list on the map" — reuses the same marker-rendering
  // effect below by feeding getFilteredPlaces() a curator-scoped Place[]
  // instead of the category/picks-filtered one.
  useEffect(() => {
    if (!curatorFilterActive) {
      setCuratorFilterPlaces([]);
      setCuratorFilterCreator(null);
      setCuratorFilterListTitle(null);
      return;
    }

    let cancelled = false;
    (async () => {
      if (itineraryIdParam) {
        navigate(`/itinerary/${itineraryIdParam}`);
        return;
      }

      if (curatorIdParam) {
        const [creator, itineraries] = await Promise.all([
          fetchCuratorById(curatorIdParam),
          fetchCuratorItineraries(curatorIdParam),
        ]);
        if (cancelled) return;
        setCuratorFilterCreator(creator);
        if (itineraries.length === 1) {
          navigate(`/itinerary/${itineraries[0].id}`);
          return;
        }
        setItineraryPicker(itineraries.length ? itineraries : listAllCuratorItineraries().filter((i) => i.curatorId === curatorIdParam));
        const placesFromItineraries: Place[] = [];
        const seen = new Set<string>();
        for (const itn of itineraries) {
          for (const day of itn.days) {
            for (const block of day.blocks) {
              if (!block.spotId || seen.has(block.spotId)) continue;
              seen.add(block.spotId);
              const match = places.find((p) => p.id === block.spotId);
              if (match) placesFromItineraries.push(match);
            }
          }
        }
        setCuratorFilterPlaces(placesFromItineraries);
        setCuratorFilterListTitle(creator ? `${creator.display_name}'s trips` : 'Itineraries');
        if (mapInstanceRef.current) fitMapToPlaces(mapInstanceRef.current, placesFromItineraries);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [curatorFilterActive, curatorIdParam, itineraryIdParam, navigate, places]);

  useEffect(() => {
    setLoading(true);
    fetchCuratedMapData(session)
      .then(({ places: curatedPlaces, picks }) => {
        setPlaces(curatedPlaces);
        setCreatorPicks(picks);
      })
      .finally(() => setLoading(false));
  }, [session.creator?.id]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.5665, 126.978],
      zoom: 13,
      zoomControl: false,
    });

    // MapTiler serves an "Invalid key" placeholder tile with a 200 status (not a
    // fetch error), so `tileerror` never fires to trigger a fallback. Only use
    // MapTiler when a real key is configured; otherwise go straight to the free
    // Carto Voyager basemap.
    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
    const osmVoyagerTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = maptilerKey
      ? L.tileLayer(`https://api.maptiler.com/maps/dataviz-v4/256/{z}/{x}/{y}.png?key=${maptilerKey}`, {
          attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          maxZoom: 19,
          crossOrigin: true,
        })
      : L.tileLayer(osmVoyagerTileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
          maxZoom: 19,
        });
    tileLayer.on('tileerror', () => tileLayer.setUrl(osmVoyagerTileUrl));
    tileLayer.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    wellnessLayerRef.current = L.layerGroup().addTo(map);
    userLocationLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // MapPage keeps this component mounted and toggles it via CSS `hidden` (so the
  // Leaflet instance survives List↔Map switches); Leaflet doesn't detect its
  // container becoming visible again after `display:none`, so nudge it here.
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => mapInstanceRef.current?.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const getFilteredPlaces = useCallback((): Place[] => {
    if (curatorFilterActive) return curatorFilterPlaces;
    let result = places;
    if (filterMode === 'category' && selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (filterMode === 'picks' && selectedPick !== 'all') {
      result = result.filter((p) =>
        selectedPick === 'ai' ? p.aiPick : selectedPick === 'creator' ? p.creatorPick : p.communityPick
      );
    }
    return result;
  }, [places, filterMode, selectedCategory, selectedPick, curatorFilterActive, curatorFilterPlaces]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    getFilteredPlaces().forEach((place) => {
      const icon = categoryMeta[place.category]?.icon ?? '✨';
      const customIcon = L.divIcon({
        html: `
          <div style="
            display:flex;align-items:center;justify-content:center;
            width:36px;height:36px;background:#D49A9A;color:white;
            border-radius:50%;box-shadow:0 4px 14px rgba(185,130,120,0.45);
            border:2px solid white;cursor:pointer;
          ">
            <span style="font-size:14px;">${icon}</span>
          </div>`,
        className: 'custom-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon });
      marker.on('click', () => {
        onSelectPlace(place);
        fitMapToPlaces(map, [place]);
      });
      marker.bindPopup(`
        <div class="place-popup-content" style="padding:6px;font-family:inherit;cursor:pointer;">
          <img src="${place.photoUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />
          <div style="font-size:13px;font-weight:bold;color:#5A514D;">${place.name}</div>
          <div style="font-size:11px;color:#D49A9A;font-weight:600;margin-top:2px;">★ ${place.rating} · ${place.area}</div>
        </div>
      `);
      // The Leaflet popup is a raw HTML string (not React), so wire the
      // navigate-to-place click directly to its DOM node each time it opens.
      marker.on('popupopen', () => {
        const el = marker.getPopup()?.getElement()?.querySelector<HTMLElement>('.place-popup-content');
        if (el) el.onclick = () => navigate(`/place/${place.id}`);
      });

      layer.addLayer(marker);
      markerMapRef.current.set(place.id, marker);
    });
  }, [places, filterMode, selectedCategory, selectedPick, getFilteredPlaces, onSelectPlace, navigate]);

  // KTO Wellness pins — tone-down Warm Taupe marker, visually distinct from Miyeon Rose beauty pins (§15.3)
  useEffect(() => {
    const layer = wellnessLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const seen = new Set<string>();
    places.forEach((place) => {
      place.nearbyWellness?.forEach((spot) => {
        if (seen.has(spot.id)) return;
        seen.add(spot.id);
        const icon = L.divIcon({
          html: `
            <div style="
              display:flex;align-items:center;justify-content:center;
              width:28px;height:28px;background:#5A514D;color:white;
              border-radius:50%;box-shadow:0 3px 10px rgba(118,100,93,0.4);
              border:2px solid white;
            ">
              <span style="font-size:11px;">🌿</span>
            </div>`,
          className: 'custom-wellness-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([spot.latitude, spot.longitude], { icon });
        marker.bindPopup(`
          <div style="padding:6px;font-family:inherit;">
            <div style="font-size:12px;font-weight:bold;color:#5A514D;">🌿 ${spot.name}</div>
            <div style="font-size:10px;color:#5A514D;margin-top:2px;">KTO Wellness Pick · 자료: 한국관광공사</div>
          </div>
        `);
        layer.addLayer(marker);
      });
    });
  }, [places]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const localMatches = places.filter(
      (p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
    );
    // Show local matches immediately, then layer in live Google results once they land.
    setSearchResults(localMatches.slice(0, 8));

    let cancelled = false;
    setIsSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const liveMatches = await searchPlacesByCategory(ENABLED_MAP_CATEGORIES, searchQuery, userLocation ?? undefined);
        if (cancelled) return;
        const seen = new Set(localMatches.map((p) => p.id));
        const combined = [...localMatches, ...liveMatches.filter((p) => !seen.has(p.id))];
        setSearchResults(combined.slice(0, 8));
      } catch {
        // fail-silent — local matches (already shown) are still valid
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, places, userLocation]);

  const handleJumpToPlace = (place: Place) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // Live Google results aren't in `places` (and so have no marker) until we add them.
    setPlaces((prev) => (prev.some((p) => p.id === place.id) ? prev : [...prev, place]));
    // Clear the category filter so the target place's pin is guaranteed to be visible.
    setSelectedCategory('all');
    setSearchQuery('');
    setIsSearchOpen(false);
    fitMapToPlaces(map, [place]);
    setTimeout(() => markerMapRef.current.get(place.id)?.openPopup(), 1100);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        if (userLocationLayerRef.current) {
          userLocationLayerRef.current.clearLayers();
          L.circle([latitude, longitude], {
            radius: Math.max(accuracy, 25),
            color: '#007AFF',
            weight: 1.5,
            fillColor: '#007AFF',
            fillOpacity: 0.12,
          }).addTo(userLocationLayerRef.current);

          const userIcon = L.divIcon({
            className: 'custom-user-location-icon',
            html: `<div class="user-location-marker"><div class="user-location-pulse"></div><div class="user-location-dot"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup('<div style="padding:4px 6px;font-size:12px;font-weight:600;">📍 Current Location</div>')
            .addTo(userLocationLayerRef.current);
        }

        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { animate: true, duration: 1.2 });
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied.'
            : 'Unable to determine location.'
        );
        setTimeout(() => setLocationError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSetFilterMode = (mode: FilterMode) => {
    setFilterMode(mode);
    setSelectedCategory('all');
    setSelectedPick('all');
  };

  return (
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-miyeon-neutral/30">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
          <Loader2 className="h-6 w-6 animate-spin text-miyeon-sub1" />
        </div>
      )}

      {locationError && (
        <div className="absolute bottom-[calc(var(--bottom-nav-h)+20px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-miyeon-main/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md sm:bottom-5">
          ⚠️ {locationError}
        </div>
      )}

      <div className="absolute right-3 bottom-[calc(var(--bottom-nav-h)+20px)] z-10 flex flex-col gap-2 sm:bottom-5">
        <MapButton onClick={() => mapInstanceRef.current?.zoomIn()} label="Zoom In">
          <Plus className="h-4 w-4" />
        </MapButton>
        <MapButton onClick={() => mapInstanceRef.current?.zoomOut()} label="Zoom Out">
          <Minus className="h-4 w-4" />
        </MapButton>
        <MapButton onClick={handleGetCurrentLocation} label="Go to current location" active={!!userLocation}>
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
        </MapButton>
      </div>

      <div className="absolute top-3 left-3 right-3 z-10 mx-auto max-w-2xl space-y-2 pointer-events-none">
        <div className="pointer-events-auto relative">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 shadow-lg backdrop-blur-md border border-white/60 px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-miyeon-main/60" />
            <input
              type="text"
              placeholder="Search Korean beauty places..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="flex-1 bg-transparent text-xs text-miyeon-main placeholder-miyeon-main/40 focus:outline-none"
            />
            {isSearchLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-miyeon-main/60" />}
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-miyeon-main/70">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSearchOpen && searchQuery && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto no-scrollbar rounded-2xl border border-miyeon-neutral bg-white shadow-2xl">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleJumpToPlace(p)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 hover:bg-miyeon-neutral/30"
                >
                  <span className="text-lg leading-none">{categoryMeta[p.category].icon}</span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-semibold text-miyeon-main">{p.name}</p>
                    <p className="text-[10px] text-miyeon-main/60">{p.area} · ★{p.rating}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-miyeon-main/60" />
                </button>
              ))}
            </div>
          )}
        </div>

        {!(isSearchOpen && searchQuery) && (
          <div className="pointer-events-auto space-y-2">
            {curatorFilterActive ? (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
                <p className="truncate text-xs font-semibold text-miyeon-main">
                  {curatorFilterListTitle
                    ? `Showing "${curatorFilterListTitle}"${curatorFilterCreator ? ` by @${curatorFilterCreator.username}` : ''}`
                    : curatorFilterCreator
                      ? `Showing ${curatorFilterCreator.display_name}'s spots`
                      : 'Showing curated spots'}
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  {curatorFilterCreator && (
                    <Link to={`/curator/${curatorFilterCreator.id}`} className="text-[11px] font-semibold text-miyeon-sub1">
                      Profile
                    </Link>
                  )}
                  <button onClick={() => setSearchParams({})} aria-label="Clear filter" className="text-miyeon-main/70">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {([
                    { id: 'category' as FilterMode, label: 'Category' },
                    { id: 'picks' as FilterMode, label: 'Picks' },
                  ]).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleSetFilterMode(mode.id)}
                      className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur-md transition-all whitespace-nowrap ${
                        filterMode === mode.id ? 'bg-miyeon-main text-white' : 'bg-white/90 text-miyeon-main/70 hover:bg-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {filterMode === 'category'
                    ? CATEGORY_FILTERS.map((cat) => (
                        <FilterChip
                          key={cat.id}
                          active={selectedCategory === cat.id}
                          label={cat.label}
                          onClick={() => setSelectedCategory(cat.id)}
                        />
                      ))
                    : PICK_FILTERS.map((pick) => (
                        <FilterChip
                          key={pick.id}
                          active={selectedPick === pick.id}
                          label={pick.label}
                          onClick={() => setSelectedPick(pick.id)}
                        />
                      ))}
                </div>
              </>
            )}
          </div>
        )}

        {creatorPicks.length > 0 && !curatorFilterActive && !(isSearchOpen && searchQuery) && (
          <div className="pointer-events-auto rounded-2xl bg-white/90 shadow-lg backdrop-blur-md border border-white/60">
            <button
              onClick={() => setIsCreatorPicksExpanded((prev) => !prev)}
              aria-expanded={isCreatorPicksExpanded}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-main/60">
                Curated by Creators
              </p>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-miyeon-main/70 transition-transform ${
                  isCreatorPicksExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isCreatorPicksExpanded && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-3.5 pb-3 pt-1">
                {creatorPicks.map((pick) => (
                  <button
                    key={pick.id}
                    type="button"
                    onClick={() => {
                      const theirs = listAllCuratorItineraries().filter((i) => i.curatorId === pick.creator.id);
                      if (theirs.length === 1) navigate(`/itinerary/${theirs[0].id}`);
                      else if (theirs.length > 1) setItineraryPicker(theirs);
                      else setSearchParams({ curator: pick.creator.id });
                    }}
                    className="group flex shrink-0 flex-col items-center gap-1.5"
                  >
                    <img
                      src={pick.creator.avatar_url}
                      alt={pick.creator.display_name}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-miyeon-sub1/30 group-hover:ring-miyeon-sub1"
                    />
                    <span className="max-w-[70px] truncate text-[11px] font-medium text-miyeon-main">
                      @{pick.creator.username}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {saved.length > 0 && !curatorFilterActive && !(isSearchOpen && searchQuery) && (
          <div className="pointer-events-auto rounded-2xl bg-white/90 shadow-lg backdrop-blur-md border border-white/60">
            <p className="px-3.5 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-miyeon-main/60">Saved trips</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-3.5 py-2.5">
              {saved.map((item) => (
                <button
                  key={item.savedId}
                  type="button"
                  onClick={() => navigate(`/itinerary/${item.snapshot.id}`)}
                  className="shrink-0 rounded-full border border-miyeon-neutral bg-white px-3 py-1.5 text-[11px] font-semibold text-miyeon-main"
                >
                  {item.snapshot.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {itineraryPicker && itineraryPicker.length > 0 && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setItineraryPicker(null)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-miyeon-main">Choose an itinerary</p>
            <div className="mt-3 space-y-1">
              {itineraryPicker.map((itn) => (
                <button
                  key={itn.id}
                  type="button"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-neutral"
                  onClick={() => navigate(`/itinerary/${itn.id}`)}
                >
                  {itn.title}
                  <span className="mt-0.5 block text-[11px] text-miyeon-main/50">
                    {itn.days.length} days · {itn.description ?? ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MapButton: React.FC<{ onClick: () => void; label: string; active?: boolean; children: React.ReactNode }> = ({
  onClick,
  label,
  active,
  children,
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg border border-black/5 transition-all hover:scale-105 active:scale-95 ${
      active ? 'text-[#007AFF] ring-2 ring-[#007AFF]/40' : 'text-miyeon-main hover:text-miyeon-sub1'
    }`}
  >
    {children}
  </button>
);

const FilterChip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({
  active,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all whitespace-nowrap ${
      active ? 'bg-miyeon-sub1 text-white shadow-miyeon-sub1/25' : 'bg-white/95 text-miyeon-main/70 hover:bg-white hover:text-miyeon-sub1'
    }`}
  >
    {label}
  </button>
);
