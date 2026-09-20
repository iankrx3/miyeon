import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, ListPlus, LogOut, MapPin, Star, Trash2 } from 'lucide-react';
import type { Itinerary, UserSession } from '../types';
import { useSavedItineraries } from '../hooks/useSavedItineraries';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { firstSpotImage, upsertItinerary } from '../lib/localItineraryStore';
import { itinerarySpotCount } from '../services/itinerary/generate';
import { createUserItinerary, deleteUserItinerary, fetchUserItineraries } from '../services/userItinerary';

interface ProfilePageProps {
  session: UserSession;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function ProfilePage({ session, onSignIn, onSignOut }: ProfilePageProps) {
  const navigate = useNavigate();
  const { saved, unsave, syncError: savedItineraryError } = useSavedItineraries(session.user?.id);
  const { saved: savedPlaceEntries, unsave: unsavePlace, syncError: savedPlaceError } =
    useSavedPlaces(session.user?.id);
  const visibleSavedPlaces = savedPlaceEntries.filter((entry) => Boolean(entry.snapshot?.name));
  const [myItineraries, setMyItineraries] = useState<Itinerary[]>([]);
  const [myItineraryError, setMyItineraryError] = useState<string | null>(null);
  const deletedMyIds = useRef(new Set<string>());
  const syncError = savedPlaceError || myItineraryError || savedItineraryError;

  const handleDeleteMyItinerary = (itineraryId: string) => {
    deletedMyIds.current.add(itineraryId);
    setMyItineraries((prev) => prev.filter((i) => i.id !== itineraryId));
    void deleteUserItinerary(itineraryId, session.user?.id).then((ok) => {
      if (!ok) {
        setMyItineraryError('Could not delete from the cloud. It may reappear on another device.');
      }
    });
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
        setMyItineraries(itineraries.filter((item) => !deletedMyIds.current.has(item.id)));
        setMyItineraryError(cloudError);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.user?.id]);

  if (!session.isLoggedIn || !session.user) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-miyeon-ink">Your trips</h1>
        <p className="text-sm text-miyeon-main/60">Sign in to see itineraries you’ve saved.</p>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-full bg-miyeon-ink px-5 py-2.5 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-b from-[#f9dde4] to-[#fef6f8] px-5 pb-6 pt-5">
        <div className="flex items-center gap-3.5">
          <img
            src={session.user.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-[60px] w-[60px] rounded-full object-cover ring-2 ring-white"
          />
          <div className="min-w-0">
            <h1 className="font-display text-[21px] font-bold text-miyeon-ink">Hi, {session.user.name}</h1>
            <p className="truncate text-xs text-miyeon-main/60">{session.user.email}</p>
          </div>
        </div>

        {syncError && (
          <p className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {syncError}
          </p>
        )}

        {session.creator ? (
          <Link
            to={`/curator/${session.creator.id}`}
            className="mt-4 inline-flex rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-miyeon-ink"
          >
            My curator page
          </Link>
        ) : (
          <Link
            to="/curator/signup"
            className="mt-4 inline-flex rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-miyeon-ink"
          >
            Become a curator
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">Saved places</h2>

        {visibleSavedPlaces.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-miyeon-line px-4 py-10 text-center">
            <p className="text-sm text-miyeon-main/60">Nothing saved yet.</p>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="mt-4 rounded-full bg-miyeon-ink px-4 py-2 text-xs font-medium text-white"
            >
              Explore the map
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleSavedPlaces.map((entry, i) => {
              const place = entry.snapshot;
              return (
                <motion.div
                  key={entry.placeId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="overflow-hidden rounded-[14px] border border-miyeon-line bg-white"
                >
                  <Link to={`/place/${entry.placeId}`} className="block">
                    <img src={place.photoUrl} alt={place.name} className="h-32 w-full object-cover" />
                  </Link>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <Link to={`/place/${entry.placeId}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-miyeon-ink">{place.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-miyeon-main/60">
                        <Star className="h-3 w-3 fill-miyeon-accent-dark text-miyeon-accent-dark" /> {place.rating} · {place.area}
                      </p>
                    </Link>
                    <button
                      type="button"
                      aria-label="Remove from saved"
                      onClick={() => unsavePlace(entry.placeId)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-miyeon-accent hover:bg-miyeon-surface"
                    >
                      <Bookmark className="h-4 w-4" fill="currentColor" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-miyeon-ink">My itineraries</h2>
          {myItineraries.length > 0 && (
            <button
              type="button"
              onClick={() => void handleCreateItinerary()}
              className="inline-flex items-center gap-1.5 rounded-full bg-miyeon-ink px-3 py-1.5 text-xs font-medium text-white"
            >
              <ListPlus className="h-3.5 w-3.5" /> Create an itinerary
            </button>
          )}
        </div>

        {myItineraries.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-miyeon-line px-4 py-10 text-center">
            <p className="text-sm text-miyeon-main/60">Nothing built yet.</p>
            <button
              type="button"
              onClick={() => void handleCreateItinerary()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-miyeon-ink px-4 py-2 text-xs font-medium text-white"
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
                  className="overflow-hidden rounded-[14px] border border-miyeon-line bg-white"
                >
                  <Link to={`/itinerary/${item.id}/build`} className="block">
                    {cover ? (
                      <img src={cover} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-miyeon-surface text-miyeon-main/40">
                        <MapPin className="h-6 w-6" />
                      </div>
                    )}
                  </Link>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <Link to={`/itinerary/${item.id}/build`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-miyeon-ink">{item.title}</p>
                      <p className="text-[11px] text-miyeon-main/60">
                        {item.days.length} day{item.days.length === 1 ? '' : 's'} · {spots} spot
                        {spots === 1 ? '' : 's'}
                      </p>
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete itinerary"
                      onClick={() => handleDeleteMyItinerary(item.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-miyeon-main/50 hover:bg-miyeon-surface hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <h2 className="mt-8 font-display text-lg font-bold text-miyeon-ink">Saved itineraries</h2>

        {saved.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-miyeon-line px-4 py-10 text-center">
            <p className="text-sm text-miyeon-main/60">Nothing saved yet.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-4 rounded-full bg-miyeon-ink px-4 py-2 text-xs font-medium text-white"
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
                  className="overflow-hidden rounded-[14px] border border-miyeon-line bg-white"
                >
                  <Link to={`/itinerary/${item.snapshot.id}`} className="block">
                    {cover ? (
                      <img src={cover} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-miyeon-surface text-miyeon-main/40">
                        <MapPin className="h-6 w-6" />
                      </div>
                    )}
                  </Link>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <Link to={`/itinerary/${item.snapshot.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-miyeon-ink">{item.snapshot.title}</p>
                      <p className="text-[11px] text-miyeon-main/60">
                        {item.snapshot.days.length} day{item.snapshot.days.length === 1 ? '' : 's'} · {spots} experience
                        {spots === 1 ? '' : 's'}
                        {item.source === 'curator' ? ' · Curator' : item.source === 'user' ? ' · Mine' : ' · MIYEON'}
                      </p>
                    </Link>
                    <button
                      type="button"
                      aria-label="Remove from saved"
                      onClick={() => unsave(item.itineraryId)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-miyeon-accent hover:bg-miyeon-surface"
                    >
                      <Bookmark className="h-4 w-4" fill="currentColor" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 border-t border-miyeon-line pt-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 text-[13px] font-medium text-miyeon-main/60 hover:text-miyeon-ink"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
