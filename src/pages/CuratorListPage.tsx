import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Itinerary, Spot, UserSession } from '../types';
import { SpotSearchPicker } from '../components/place/SpotSearchPicker';
import { ItineraryTimeline } from '../components/itinerary/ItineraryTimeline';
import { removeItinerary, upsertItinerary } from '../lib/localItineraryStore';
import { addEmptyDay, addSpotToDay, removeSpotFromItinerary } from '../services/itinerary/generate';
import { deleteCuratorItinerary, fetchItineraryById, updateCuratorItinerary } from '../services/curator';

interface CuratorListPageProps {
  session: UserSession;
}

export default function CuratorListPage({ session }: CuratorListPageProps) {
  const { id, itineraryId, listId } = useParams<{ id: string; itineraryId?: string; listId?: string }>();
  const resolvedId = itineraryId || listId;
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickingDay, setPickingDay] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(id && session.creator?.id === id);

  useEffect(() => {
    if (!resolvedId) return;
    setLoading(true);
    fetchItineraryById(resolvedId)
      .then((found) => {
        setItinerary(found);
        if (found) setTitleDraft(found.title);
      })
      .finally(() => setLoading(false));
  }, [resolvedId]);

  const persist = async (next: Itinerary) => {
    upsertItinerary(next);
    setItinerary(next);
    if (isOwner) {
      try {
        await updateCuratorItinerary(session, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save itinerary.');
      }
    }
  };

  const handleAddSpot = async (spot: Spot) => {
    if (!itinerary || pickingDay == null) return;
    await persist(addSpotToDay(itinerary, pickingDay, spot));
    setPickingDay(null);
  };

  const handleDelete = async () => {
    if (!itinerary || !window.confirm('Delete this itinerary?')) return;
    try {
      await deleteCuratorItinerary(session, itinerary.id);
      removeItinerary(itinerary.id);
      navigate(`/curator/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    }
  };

  if (loading) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!itinerary) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Itinerary not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(`/curator/${id}`)}
        className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to profile
      </button>

      <div className="flex items-start justify-between gap-3">
        {editingTitle && isOwner ? (
          <div className="flex w-full items-center gap-2">
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full rounded-full border border-miyeon-neutral px-3.5 py-1.5 font-display text-lg text-miyeon-main"
            />
            <button
              type="button"
              onClick={() => {
                persist({ ...itinerary, title: titleDraft.trim() || itinerary.title });
                setEditingTitle(false);
              }}
              className="rounded-full bg-miyeon-sub1 px-3.5 py-1.5 text-xs font-bold text-white"
            >
              Save
            </button>
          </div>
        ) : (
          <div>
            <h1 className="font-display text-2xl text-miyeon-main">{itinerary.title}</h1>
            <p className="text-xs text-miyeon-main/60">
              {itinerary.days.length} days · ${itinerary.estimatedSpendUsd} estimated
            </p>
          </div>
        )}
        {isOwner && !editingTitle && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditingTitle(true)} className="rounded-full border border-miyeon-neutral p-2">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={handleDelete} className="rounded-full border border-miyeon-neutral p-2 text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => navigate(`/itinerary/${itinerary.id}`)}
        className="flex items-center gap-1.5 rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main"
      >
        <MapPin className="h-3.5 w-3.5" /> View on map
      </button>

      {itinerary.days.map((day) => (
        <section key={day.dayIndex} className="space-y-3 rounded-3xl border border-miyeon-neutral p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-miyeon-main">
              Day {day.dayIndex} · {day.areaLabel}
            </h2>
            {isOwner && (
              <button
                type="button"
                onClick={() => setPickingDay(day.dayIndex)}
                className="flex items-center gap-1 text-xs font-bold text-miyeon-sub1"
              >
                <Plus className="h-3.5 w-3.5" /> Add spot
              </button>
            )}
          </div>
          {day.blocks.filter((b) => b.kind === 'spot').length === 0 ? (
            <p className="text-sm text-miyeon-main/50">No spots yet.</p>
          ) : (
            <ItineraryTimeline
              day={day}
              onOpenSpot={(spot) => navigate(`/place/${spot.id}`)}
              onOpenMenu={
                isOwner
                  ? (blockId) => persist(removeSpotFromItinerary(itinerary, day.dayIndex, blockId))
                  : undefined
              }
            />
          )}
        </section>
      ))}

      {isOwner && (
        <button
          type="button"
          onClick={() => persist(addEmptyDay(itinerary))}
          className="w-full rounded-full border border-dashed border-miyeon-neutral py-3 text-xs font-bold text-miyeon-main/70"
        >
          + Add a day
        </button>
      )}

      {pickingDay != null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setPickingDay(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-semibold text-miyeon-main">Add a spot to day {pickingDay}</p>
            <SpotSearchPicker
              onSelect={handleAddSpot}
              onClose={() => setPickingDay(null)}
              excludeIds={itinerary.days.flatMap((d) => d.blocks.map((b) => b.spotId).filter((x): x is string => Boolean(x)))}
            />
          </div>
        </div>
      )}

    </div>
  );
}
