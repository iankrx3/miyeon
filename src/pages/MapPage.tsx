import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, List, Map as MapIcon, Star, X } from 'lucide-react';
import { MapView } from '../components/map/MapView';
import { PlaceListView } from '../components/map/PlaceListView';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import type { Place, UserSession } from '../types';

export default function MapPage({ session, onSignIn }: { session: UserSession; onSignIn: () => void }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { isSaved, toggleSave } = useSavedPlaces(session.user?.id);

  return (
    <div className="relative">
      <div className={viewMode === 'map' ? '' : 'hidden'}>
        <MapView onSelectPlace={setSelectedPlace} session={session} visible={viewMode === 'map'} />
      </div>
      <div className={viewMode === 'list' ? '' : 'hidden'}>
        <PlaceListView session={session} />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        aria-label={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
        title={viewMode === 'map' ? 'Switch to list view' : 'Switch to map view'}
        className="absolute left-3 bottom-[calc(var(--bottom-nav-h)+20px)] z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-miyeon-main shadow-lg border border-black/5 hover:text-miyeon-sub1 sm:bottom-5"
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

      <AnimatePresence>
        {viewMode === 'map' && selectedPlace && (
          <div className="absolute bottom-[calc(var(--bottom-nav-h)+16px)] left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 sm:bottom-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="relative rounded-2xl border border-miyeon-neutral bg-white p-4 shadow-2xl"
            >
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute right-3 top-3 text-miyeon-main/60 hover:text-miyeon-main"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="pr-6 text-sm font-semibold text-miyeon-main">{selectedPlace.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-miyeon-main/60">
                <Star className="h-3 w-3 fill-miyeon-sub1 text-miyeon-sub1" /> {selectedPlace.rating} · {selectedPlace.priceRange} · {selectedPlace.area}
              </p>
              <div className="mt-3 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/place/${selectedPlace.id}`)}
                  className="flex-1 rounded-full bg-miyeon-main px-4 py-2 text-xs font-bold text-white"
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
                    toggleSave(selectedPlace.id);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold ${
                    isSaved(selectedPlace.id) ? 'border-miyeon-sub1 bg-miyeon-sub1 text-white' : 'border-miyeon-neutral text-miyeon-main'
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
