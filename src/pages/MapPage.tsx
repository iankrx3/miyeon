import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, List, ListPlus, Loader2, Map as MapIcon, Star, X } from 'lucide-react';
import { MapView } from '../components/map/MapView';
import { PlaceListView } from '../components/map/PlaceListView';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { useSpotsCatalog } from '../hooks/useSpotsCatalog';
import { createUserItinerary } from '../services/userItinerary';
import type { Place, UserSession } from '../types';

export default function MapPage({ session, onSignIn }: { session: UserSession; onSignIn: () => void }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { isSaved, toggleSave } = useSavedPlaces(session.user?.id);
  const spotsReady = useSpotsCatalog();

  const handleCreateItinerary = async () => {
    if (!session.isLoggedIn) {
      onSignIn();
      return;
    }
    const itinerary = await createUserItinerary(session, 'My Itinerary');
    navigate(`/itinerary/${itinerary.id}/build`);
  };

  return (
    <div className="relative">
      {!spotsReady ? (
        <div className="flex h-[calc(100dvh-var(--header-h))] w-full items-center justify-center bg-miyeon-surface/30">
          <Loader2 className="h-6 w-6 animate-spin text-miyeon-accent" />
        </div>
      ) : (
        <>
          <div className={viewMode === 'map' ? '' : 'hidden'}>
            <MapView onSelectPlace={setSelectedPlace} session={session} visible={viewMode === 'map'} />
          </div>
          <div className={viewMode === 'list' ? '' : 'hidden'}>
            <PlaceListView session={session} />
          </div>
        </>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        aria-label={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
        title={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
        className="absolute left-3 bottom-[calc(var(--bottom-nav-h)+20px)] z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-miyeon-main shadow-lg border border-black/5 hover:text-miyeon-accent sm:bottom-5"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={viewMode}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {viewMode === 'map' ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {!(viewMode === 'map' && selectedPlace) && (
        <div className="absolute left-1/2 z-20 -translate-x-1/2 bottom-[calc(var(--bottom-nav-h)+20px)] sm:bottom-5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateItinerary}
            aria-label="Create an itinerary"
            className="flex items-center gap-1.5 rounded-full bg-miyeon-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2"
          >
            <ListPlus className="h-3.5 w-3.5" />
            Create an itinerary
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {viewMode === 'map' && selectedPlace && (
          <div className="absolute bottom-[calc(var(--bottom-nav-h)+16px)] left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 sm:bottom-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="relative rounded-2xl border border-miyeon-line bg-white p-4 shadow-2xl"
            >
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute right-3 top-3 text-miyeon-main/60 hover:text-miyeon-main"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="pr-6 text-sm font-semibold text-miyeon-main">{selectedPlace.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-miyeon-main/60">
                <Star className="h-3 w-3 fill-miyeon-accent text-miyeon-accent" /> {selectedPlace.rating} · {selectedPlace.priceRange} · {selectedPlace.area}
              </p>
              <div className="mt-3 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/place/${selectedPlace.id}`)}
                  className="flex-1 rounded-full bg-miyeon-ink px-4 py-2 text-xs font-bold text-white"
                >
                  VIEW PLACE
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!session.isLoggedIn) {
                      onSignIn();
                      return;
                    }
                    toggleSave(selectedPlace);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold ${
                    isSaved(selectedPlace.id) ? 'border-miyeon-accent bg-miyeon-accent text-white' : 'border-miyeon-line text-miyeon-main'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" fill={isSaved(selectedPlace.id) ? 'currentColor' : 'none'} />
                  {isSaved(selectedPlace.id) ? 'Saved' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
