import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, ListPlus, MapPin, Star, Trash2 } from 'lucide-react';
import type { Itinerary, UserSession } from '../types';
import { useSavedItineraries } from '../hooks/useSavedItineraries';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { firstSpotImage, upsertItinerary } from '../lib/localItineraryStore';
import { itinerarySpotCount } from '../services/itinerary/generate';
import { createUserItinerary, deleteUserItinerary, fetchUserItineraries } from '../services/userItinerary';

interface ProfilePageProps {
  session: UserSession;
  onSignIn: () => void;
}

export default function ProfilePage({ session, onSignIn }: ProfilePageProps) {
  const navigate = useNavigate();
  const { saved, unsave, syncError: savedItineraryError } = useSavedItineraries(session.user?.id);
  const { savedPlaces, unsave: unsavePlace, syncError: savedPlaceError } = useSavedPlaces(session.user?.id);
  const [myItineraries, setMyItineraries] = useState<Itinerary[]>([]);
  const [myItineraryError, setMyItineraryError] = useState<string | null>(null);
  const syncError = savedPlaceError || myItineraryError || savedItineraryError;

  const handleDeleteMyItinerary = (itineraryId: string) => {
    void deleteUserItinerary(itineraryId, session.user?.id);
    setMyItineraries((prev) => prev.filter((i) => i.id !== itineraryId));
  };

  const handleCreateItinerary = async () => {
    if (!session.isLoggedIn) {
      onSignIn();
      return;
    }
    const itinerary = await createUserItinerary(session, 'My Itinerary');
    navigate(`/itinerary/${itinerary.id}/build`);
  };

  useEffect(() => {
    saved.forEach((item) => upsertItinerary(item.snapshot));
  }, [saved]);

  useEffect(() => {
    if (!session.user) {
      setMyItineraries([]);
      return;
    }
    let cancelled = false;
    fetchUserItineraries(session.user.id).then(({ itineraries, syncError: cloudError }) => {
      if (!cancelled) {
        setMyItineraries(itineraries);
        setMyItineraryError(cloudError);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.user?.id]);

  if (!session.isLoggedIn || !session.user) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-miyeon-main">Your trips</h1>
        <p className="text-sm text-miyeon-main/60">Sign in to see itineraries you’ve saved.</p>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-full bg-miyeon-sub1 px-5 py-2.5 text-sm font-bold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <img
          src={session.user.avatar_url}
          alt=""
          referrerPolicy="no-referrer"
          className="h-14 w-14 rounded-full object-cover ring-1 ring-miyeon-neutral"
        />
        <div>
          <h1 className="font-display text-2xl text-miyeon-main">{session.user.name}</h1>
          <p className="text-xs text-miyeon-main/60">{session.user.email}</p>
        </div>
      </div>

      {syncError && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {syncError}
        </p>
      )}

      {session.creator ? (
        <Link
          to={`/curator/${session.creator.id}`}
          className="mt-4 inline-flex rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main"
        >
          My curator page
        </Link>
      ) : (
        <Link
          to="/curator/signup"
          className="mt-4 inline-flex rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main"
        >
          Become a curator
        </Link>
      )}

      <h2 className="mt-8 text-sm font-semibold text-miyeon-main">Saved places</h2>

      {savedPlaces.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-miyeon-neutral px-4 py-10 text-center">
          <p className="text-sm text-miyeon-main/60">Nothing saved yet.</p>
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="mt-4 rounded-full bg-miyeon-sub1 px-4 py-2 text-xs font-bold text-white"
          >
            Explore the map
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {savedPlaces.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-miyeon-neutral bg-white shadow-sm"
            >
              <Link to={`/place/${place.id}`} className="block">
                <img src={place.photoUrl} alt={place.name} className="h-32 w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-miyeon-main">{place.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-miyeon-main/60">
                    <Star className="h-3 w-3 fill-miyeon-sub1 text-miyeon-sub1" /> {place.rating} · {place.area}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Remove from saved"
                onClick={() => unsavePlace(place.id)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-miyeon-sub1 shadow-sm"
              >
                <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-miyeon-main">My itineraries</h2>
        {myItineraries.length > 0 && (
          <button
            type="button"
            onClick={() => void handleCreateItinerary()}
            className="inline-flex items-center gap-1.5 rounded-full bg-miyeon-sub1 px-3 py-1.5 text-xs font-bold text-white"
          >
            <ListPlus className="h-3.5 w-3.5" /> Create an itinerary
          </button>
        )}
      </div>

      {myItineraries.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-miyeon-neutral px-4 py-10 text-center">
          <p className="text-sm text-miyeon-main/60">Nothing built yet.</p>
          <button
            type="button"
            onClick={() => void handleCreateItinerary()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-miyeon-sub1 px-4 py-2 text-xs font-bold text-white"
          >
            <ListPlus className="h-3.5 w-3.5" /> Create an itinerary
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {myItineraries.map((item, i) => {
            const cover = firstSpotImage(item);
            const spots = itinerarySpotCount(item);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-miyeon-neutral bg-white shadow-sm"
              >
                <Link to={`/itinerary/${item.id}/build`} className="block">
                  {cover ? (
                    <img src={cover} alt="" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-miyeon-neutral/50 text-miyeon-main/40">
                      <MapPin className="h-6 w-6" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-miyeon-main">{item.title}</p>
                    <p className="text-[11px] text-miyeon-main/60">
                      {item.days.length} day{item.days.length === 1 ? '' : 's'} · {spots} spot
                      {spots === 1 ? '' : 's'}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Delete itinerary"
                  onClick={() => handleDeleteMyItinerary(item.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-miyeon-main/60 shadow-sm hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-miyeon-main">Saved itineraries</h2>

      {saved.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-miyeon-neutral px-4 py-10 text-center">
          <p className="text-sm text-miyeon-main/60">Nothing saved yet.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 rounded-full bg-miyeon-sub1 px-4 py-2 text-xs font-bold text-white"
          >
            Plan a trip
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {saved.map((item, i) => {
            const cover = firstSpotImage(item.snapshot);
            const spots = itinerarySpotCount(item.snapshot);
            return (
              <motion.div
                key={item.savedId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-miyeon-neutral bg-white shadow-sm"
              >
                <Link to={`/itinerary/${item.snapshot.id}`} className="block">
                  {cover ? (
                    <img src={cover} alt="" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-miyeon-neutral/50 text-miyeon-main/40">
                      <MapPin className="h-6 w-6" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-miyeon-main">{item.snapshot.title}</p>
                    <p className="text-[11px] text-miyeon-main/60">
                      {item.snapshot.days.length} day{item.snapshot.days.length === 1 ? '' : 's'} · {spots} experience
                      {spots === 1 ? '' : 's'}
                      {item.source === 'curator' ? ' · Curator' : item.source === 'user' ? ' · Mine' : ' · MIYEON'}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Remove from saved"
                  onClick={() => unsave(item.itineraryId)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-miyeon-sub1 shadow-sm"
                >
                  <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
