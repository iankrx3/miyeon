import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bookmark, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import type { Itinerary, RegeneratePreference, ReplacePreference, Spot, UserSession } from '../types';
import { regenerateOptions, replaceOptions } from '../data/quiz';
import { getSpot } from '../data/spots';
import { ItineraryRouteMap } from '../components/itinerary/ItineraryRouteMap';
import { ItineraryTimeline } from '../components/itinerary/ItineraryTimeline';
import { GlowUpResultView } from '../components/glowup/GlowUpResultView';
import { useSavedItineraries } from '../hooks/useSavedItineraries';
import { useSpotsCatalog } from '../hooks/useSpotsCatalog';
import { getStoredItinerary, isCategoryPlan, upsertItinerary } from '../lib/localItineraryStore';
import { persistUserItinerary } from '../services/userItinerary';
import {
  itinerarySpotCount,
  moveSpotToDay,
  regenerateItinerary,
  removeSpotFromItinerary,
  replaceSpotInItinerary,
} from '../services/itinerary/generate';

interface ItineraryPageProps {
  session: UserSession;
  onSignIn: () => void;
}

export default function ItineraryPage({ session, onSignIn }: ItineraryPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(() => (id ? getStoredItinerary(id) : null));
  const [dayIndex, setDayIndex] = useState(1);
  const [menu, setMenu] = useState<{ blockId: string; spot: Spot } | null>(null);
  const [sheet, setSheet] = useState<'replace' | 'regenerate' | 'move' | null>(null);
  const { isSaved, toggleSave, updateSavedSnapshot } = useSavedItineraries(session.user?.id);
  const spotsReady = useSpotsCatalog();

  const day = itinerary?.days.find((d) => d.dayIndex === dayIndex) ?? itinerary?.days[0];

  const persist = (next: Itinerary) => {
    setItinerary(next);
    if (next.source === 'user') {
      void persistUserItinerary(session, next);
    } else {
      upsertItinerary(next);
    }
    updateSavedSnapshot(next);
  };

  const spotsInDay = useMemo(() => {
    if (!day) return [];
    return day.blocks.map((b) => (b.spotId ? getSpot(b.spotId) : undefined)).filter((s): s is Spot => Boolean(s));
  }, [day, spotsReady]);

  if (!itinerary || !day) {
    return (
      <div className="px-4 py-10 text-sm text-miyeon-main/60">
        Itinerary not found.{' '}
        <button type="button" className="underline" onClick={() => navigate('/')}>
          Plan a trip
        </button>
      </div>
    );
  }

  // Glow Up plans are category recommendations (no venues, no map). Older saved
  // Glow Up plans still carry venue blocks and keep the map + timeline layout.
  if (isCategoryPlan(itinerary)) {
    return (
      <GlowUpResultView
        itinerary={itinerary}
        day={day}
        onSelectDay={setDayIndex}
        saved={isSaved(itinerary.id)}
        onToggleSave={() => (session.isLoggedIn ? toggleSave(itinerary) : onSignIn())}
        onBack={() => navigate(-1)}
        userEmail={session.user?.email}
      />
    );
  }

  const hasPinnedVenues = itinerary.days.some((d) =>
    d.blocks.some((b) => b.latitude != null && b.longitude != null)
  );
  if (!spotsReady && !hasPinnedVenues) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-miyeon-accent" />
      </div>
    );
  }

  const experiences = itinerarySpotCount(itinerary);
  const isGlowUpOnly = Boolean(itinerary.glowUpSnapshot && !itinerary.profileSnapshot);
  const canEdit = Boolean(
    (!isGlowUpOnly && itinerary.source === 'miyeon') ||
      itinerary.id.startsWith('snap_') ||
      (session.creator?.id && session.creator.id === itinerary.curatorId) ||
      (itinerary.source === 'user' && session.user?.id === itinerary.userId)
  );

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h))] flex-col sm:flex-row">
      <div className="h-[300px] sm:h-auto sm:flex-1">
        <ItineraryRouteMap
          day={day}
          onSelectSpot={(spot) => navigate(`/place/${spot.id}`, { state: { fromItinerary: itinerary.id } })}
        />
      </div>

      <section className="flex flex-col border-t border-miyeon-line bg-white sm:overflow-hidden sm:w-[26rem] sm:border-l sm:border-t-0">
        <header className="shrink-0 bg-gradient-to-b from-[#f9dde4] to-[#fef6f8] px-5 pb-4 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-[13px] text-miyeon-main/70"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2">
              {itinerary.source === 'miyeon' && itinerary.profileSnapshot && (
                <button
                  type="button"
                  onClick={() => setSheet('regenerate')}
                  className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-miyeon-ink"
                >
                  <Sparkles className="h-3 w-3" /> Regenerate
                </button>
              )}
              <button
                type="button"
                onClick={() => (session.isLoggedIn ? toggleSave(itinerary) : onSignIn())}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  isSaved(itinerary.id)
                    ? 'bg-miyeon-accent text-white'
                    : 'bg-white/70 text-miyeon-ink'
                }`}
              >
                <Bookmark className="h-3 w-3" fill={isSaved(itinerary.id) ? 'currentColor' : 'none'} />
                {isSaved(itinerary.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent-dark">
            ✦ YOUR GLOW UP PLAN
          </p>
          <h1 className="mt-1.5 font-display text-[22px] font-bold leading-[1.25] text-miyeon-ink">
            {itinerary.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-miyeon-main">
              {day.areaLabel}
            </span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-miyeon-main">
              {itinerary.days.length} days · {experiences} experiences
            </span>
            {itinerary.estimatedSpendUsd > 0 && (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-miyeon-main">
                ~${itinerary.estimatedSpendUsd}
              </span>
            )}
          </div>
        </header>

        <div className="sticky top-[var(--header-h)] z-10 flex shrink-0 gap-2 overflow-x-auto bg-white px-4 py-3.5 no-scrollbar sm:static">
          {itinerary.days.map((d) => (
            <button
              key={d.dayIndex}
              type="button"
              onClick={() => setDayIndex(d.dayIndex)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium ${
                d.dayIndex === day.dayIndex
                  ? 'bg-miyeon-ink text-white'
                  : 'border border-miyeon-line bg-miyeon-surface text-miyeon-main'
              }`}
            >
              Day {d.dayIndex}
            </button>
          ))}
        </div>

        <div className="px-4 pb-24 sm:flex-1 sm:overflow-y-auto sm:pb-8">
          <ItineraryTimeline
            day={day}
            profile={itinerary.profileSnapshot}
            glowUpProfile={itinerary.glowUpSnapshot}
            onOpenSpot={(spot) => navigate(`/place/${spot.id}`, { state: { fromItinerary: itinerary.id } })}
            onOpenMenu={
              canEdit
                ? (blockId, spot) => {
                    setMenu({ blockId, spot });
                    setSheet(null);
                  }
                : undefined
            }
          />
        </div>
      </section>

      {menu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setMenu(null)}>
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-4 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-miyeon-main">{menu.spot.name}</p>
            <div className="mt-3 space-y-1">
              {['Replace', 'Move to another day', 'Remove', 'View details'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-surface"
                  onClick={() => {
                    if (label === 'View details') {
                      navigate(`/place/${menu.spot.id}`, { state: { fromItinerary: itinerary.id } });
                      setMenu(null);
                    } else if (label === 'Remove') {
                      persist(removeSpotFromItinerary(itinerary, day.dayIndex, menu.blockId));
                      setMenu(null);
                    } else if (label === 'Replace') {
                      setSheet('replace');
                    } else {
                      setSheet('move');
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
          onClick={() => {
            setSheet(null);
            setMenu(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-4 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-miyeon-main">
              {sheet === 'replace' ? 'What would you like instead?' : sheet === 'regenerate' ? 'What should we change?' : 'Move to which day?'}
            </p>
            <div className="mt-3 space-y-1">
              {sheet === 'move' &&
                itinerary.days
                  .filter((d) => d.dayIndex !== day.dayIndex)
                  .map((d) => (
                    <button
                      key={d.dayIndex}
                      type="button"
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-surface"
                      onClick={() => {
                        if (menu) persist(moveSpotToDay(itinerary, day.dayIndex, menu.blockId, d.dayIndex));
                        setSheet(null);
                        setMenu(null);
                      }}
                    >
                      Day {d.dayIndex} · {d.areaLabel}
                    </button>
                  ))}
              {sheet === 'replace' &&
                replaceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-surface"
                    onClick={() => {
                      if (menu) {
                        persist(
                          replaceSpotInItinerary(itinerary, day.dayIndex, menu.blockId, opt.id as ReplacePreference)
                        );
                      }
                      setSheet(null);
                      setMenu(null);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              {sheet === 'regenerate' &&
                regenerateOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-surface"
                    onClick={() => {
                      persist(regenerateItinerary(itinerary, opt.id as RegeneratePreference));
                      setDayIndex(1);
                      setSheet(null);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {spotsInDay.length === 0 && <span className="sr-only">Empty day</span>}
    </div>
  );
}
