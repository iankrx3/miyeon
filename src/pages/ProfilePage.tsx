import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, ListPlus, LogOut, MapPin, Star, Trash2 } from 'lucide-react';

const HELP_EMAIL = 'o3c.korea@gmail.com';
import type { Itinerary, UserSession } from '../types';
import { useSavedItineraries } from '../hooks/useSavedItineraries';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { SwipeRow } from '../components/common/SwipeRow';
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

      <div className="mx-auto max-w-2xl px-5 pt-6">
        <div id="itineraries" className="flex scroll-mt-20 items-center justify-between gap-3">
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
      </div>

      <section className="mt-7 bg-miyeon-surface">
        <div className="mx-auto max-w-2xl px-5 pb-[26px] pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[18px] font-bold text-miyeon-ink">Saved places</h2>
            {visibleSavedPlaces.length > 0 && (
              <p className="text-[12px] font-medium text-miyeon-main/60">
                {visibleSavedPlaces.length} item{visibleSavedPlaces.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {visibleSavedPlaces.length === 0 ? (
            <div className="mt-3.5 rounded-2xl border border-dashed border-miyeon-line bg-white px-4 py-10 text-center">
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
            <SwipeRow gap="gap-[11px]" className="mt-3.5">
              {visibleSavedPlaces.map((entry) => {
                const place = entry.snapshot;
                return (
                  <div key={entry.placeId} className="w-[128px] shrink-0 snap-start">
                    <div className="relative">
                      <Link to={`/place/${entry.placeId}`} className="block">
                        <img src={place.photoUrl} alt={place.name} className="h-[110px] w-full rounded-[12px] object-cover" />
                      </Link>
                      <button
                        type="button"
                        aria-label="Remove from saved"
                        onClick={() => unsavePlace(entry.placeId)}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white"
                      >
                        <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                      </button>
                    </div>
                    <Link to={`/place/${entry.placeId}`} className="mt-[9px] block">
                      <p className="truncate text-[12.5px] font-medium text-miyeon-ink">{place.name}</p>
                      <p className="mt-[3px] flex items-center gap-1 text-[12px] font-medium text-miyeon-accent-dark">
                        <Star className="h-3 w-3 fill-miyeon-accent-dark text-miyeon-accent-dark" /> {place.rating}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </SwipeRow>
          )}

          <div className="mt-7 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-bold text-miyeon-ink">Saved itineraries</h2>
            {saved.length > 0 && (
              <p className="text-[12px] font-medium text-miyeon-main/60">
                {saved.length} item{saved.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
  
          {saved.length === 0 ? (
            <div className="mt-3.5 rounded-2xl border border-dashed border-miyeon-line bg-white px-4 py-10 text-center">
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
            <SwipeRow gap="gap-[11px]" className="mt-3.5">
              {saved.map((item) => {
                const cover = firstSpotImage(item.snapshot);
                const spots = itinerarySpotCount(item.snapshot);
                const days = item.snapshot.days.length;
                return (
                  <div key={item.savedId} className="w-[160px] shrink-0 snap-start">
                    <div className="relative">
                      <Link to={`/itinerary/${item.snapshot.id}`} className="block">
                        {cover ? (
                          <img src={cover} alt="" className="h-[110px] w-full rounded-[12px] object-cover" />
                        ) : (
                          <div className="flex h-[110px] w-full items-center justify-center rounded-[12px] bg-white text-miyeon-main/40">
                            <MapPin className="h-6 w-6" />
                          </div>
                        )}
                      </Link>
                      <button
                        type="button"
                        aria-label="Remove from saved"
                        onClick={() => unsave(item.itineraryId)}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white"
                      >
                        <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                      </button>
                    </div>
                    <Link to={`/itinerary/${item.snapshot.id}`} className="mt-[9px] block">
                      <p className="truncate text-[12.5px] font-medium text-miyeon-ink">{item.snapshot.title}</p>
                      <p className="mt-[3px] truncate text-[11px] text-miyeon-main/60">
                        {days} day{days === 1 ? '' : 's'} · {spots} experience{spots === 1 ? '' : 's'}
                        {item.source === 'curator' ? ' · Curator' : item.source === 'user' ? ' · Mine' : ''}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </SwipeRow>
          )}
          </div>
      </section>

      <div className="mx-auto max-w-2xl px-5 pb-6">
        <div className="mt-8">
          <MenuRow title="My Beauty Card" caption="Show this at the clinic" disabled />
          <MenuRow
            title="Booking history"
            caption={`${myItineraries.length + saved.length} itinerar${myItineraries.length + saved.length === 1 ? 'y' : 'ies'}`}
            onClick={() => document.getElementById('itineraries')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <MenuRow title="Language & region" caption="English · USD" disabled />
          <MenuRow title="Notifications" caption="Trip reminders" disabled />
          <MenuRow title="Help & contact" href={`mailto:${HELP_EMAIL}`} />
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 py-4 text-[13px] font-medium text-miyeon-main/60 hover:text-miyeon-ink"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

interface MenuRowProps {
  title: string;
  caption?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({ title, caption, onClick, href, disabled }) => {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className={`text-[14.5px] font-medium ${disabled ? 'text-miyeon-ink/40' : 'text-miyeon-ink'}`}>{title}</p>
        {caption && <p className="text-[11px] text-miyeon-main/45">{caption}</p>}
      </div>
      {!disabled && <span className="text-lg text-miyeon-main/35">›</span>}
    </>
  );

  const rowClass = 'flex w-full items-center gap-2 border-b border-miyeon-line py-[15px] text-left';

  if (disabled) {
    return (
      <div className={rowClass} aria-disabled="true">
        {content}
      </div>
    );
  }
  if (href) {
    return (
      <a href={href} className={rowClass}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {content}
    </button>
  );
};
