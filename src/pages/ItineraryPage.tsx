import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bookmark, ChevronLeft, Sparkles } from 'lucide-react';
import type { Itinerary, RegeneratePreference, ReplacePreference, Spot, UserSession } from '../types';
import { regenerateOptions, replaceOptions } from '../data/quiz';
import { getSpot } from '../data/spots';
import { ItineraryRouteMap } from '../components/itinerary/ItineraryRouteMap';
import { ItineraryTimeline } from '../components/itinerary/ItineraryTimeline';
import { useSavedItineraries } from '../hooks/useSavedItineraries';
import { getStoredItinerary, upsertItinerary } from '../lib/localItineraryStore';
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
  const { isSaved, toggleSave } = useSavedItineraries(session.user?.id);

  const day = itinerary?.days.find((d) => d.dayIndex === dayIndex) ?? itinerary?.days[0];

  const persist = (next: Itinerary) => {
    upsertItinerary(next);
    setItinerary(next);
  };

  const spotsInDay = useMemo(() => {
    if (!day) return [];
    return day.blocks.map((b) => (b.spotId ? getSpot(b.spotId) : undefined)).filter((s): s is Spot => Boolean(s));
  }, [day]);

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

  const experiences = itinerarySpotCount(itinerary);
  const canEdit = Boolean(
    itinerary.source === 'miyeon' ||
      itinerary.id.startsWith('snap_') ||
      (session.creator?.id && session.creator.id === itinerary.curatorId)
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col sm:flex-row">
      <div className="h-[42vh] min-h-[240px] sm:h-auto sm:flex-1">
        <ItineraryRouteMap
          day={day}
          onSelectSpot={(spot) => navigate(`/place/${spot.id}`, { state: { fromItinerary: itinerary.id } })}
        />
      </div>

      <section className="flex max-h-[58vh] flex-col overflow-hidden border-t border-miyeon-neutral bg-white sm:max-h-none sm:w-[26rem] sm:border-l sm:border-t-0">
        <header className="shrink-0 space-y-3 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2">
              {itinerary.source === 'miyeon' && (
                <button
                  type="button"
                  onClick={() => setSheet('regenerate')}
                  className="flex items-center gap-1 rounded-full border border-miyeon-neutral px-3 py-1.5 text-[11px] font-bold text-miyeon-main"
                >
                  <Sparkles className="h-3 w-3" /> Regenerate
                </button>
              )}
              <button
                type="button"
                onClick={() => (session.isLoggedIn ? toggleSave(itinerary) : onSignIn())}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                  isSaved(itinerary.id)
                    ? 'border-miyeon-sub1 bg-miyeon-sub1 text-white'
                    : 'border-miyeon-neutral text-miyeon-main'
                }`}
              >
                <Bookmark className="h-3 w-3" fill={isSaved(itinerary.id) ? 'currentColor' : 'none'} />
                {isSaved(itinerary.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl text-miyeon-main">{itinerary.title}</h1>
            <p className="text-xs text-miyeon-main/60">
              {itinerary.days.length} days · {experiences} experiences
              {itinerary.estimatedSpendUsd > 0 && ` · Estimated beauty spend $${itinerary.estimatedSpendUsd}`}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {itinerary.days.map((d) => (
              <button
                key={d.dayIndex}
                type="button"
                onClick={() => setDayIndex(d.dayIndex)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  d.dayIndex === day.dayIndex
                    ? 'bg-miyeon-main text-white'
                    : 'border border-miyeon-neutral text-miyeon-main/70'
                }`}
              >
                DAY {d.dayIndex}
                <span className="ml-1 font-medium opacity-80">{d.areaLabel}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-24 sm:pb-8">
          <ItineraryTimeline
            day={day}
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
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-neutral"
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
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-neutral"
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
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-neutral"
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
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-miyeon-main hover:bg-miyeon-neutral"
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
