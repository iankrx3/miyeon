import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { CuratorList, ListSpot, Place, UserSession } from '../types';
import {
  addSpotToList,
  deleteList,
  fetchListById,
  fetchListSpots,
  removeSpotFromList,
  updateList,
} from '../services/curator';
import { PlaceCard } from '../components/place/PlaceCard';
import { PlaceSearchPicker } from '../components/place/PlaceSearchPicker';

interface CuratorListPageProps {
  session: UserSession;
}

export default function CuratorListPage({ session }: CuratorListPageProps) {
  const { id, listId } = useParams<{ id: string; listId: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<CuratorList | null>(null);
  const [spots, setSpots] = useState<ListSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);

  const isOwner = Boolean(id && session.creator?.id === id);

  useEffect(() => {
    if (!listId) return;
    setLoading(true);
    Promise.all([fetchListById(listId), fetchListSpots(listId)])
      .then(([l, s]) => {
        setList(l);
        setSpots(s);
      })
      .finally(() => setLoading(false));
  }, [listId]);

  const confirmAddSpot = async () => {
    if (!pendingPlace || !listId || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const spot = await addSpotToList(session, listId, pendingPlace, note.trim() || undefined);
      setSpots((prev) => [...prev, spot]);
      setList((prev) => (prev ? { ...prev, spot_count: prev.spot_count + 1 } : prev));
      setPendingPlace(null);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this spot. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (spotId: string) => {
    if (!listId) return;
    setError(null);
    try {
      await removeSpotFromList(session, listId, spotId);
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setList((prev) => (prev ? { ...prev, spot_count: Math.max(0, prev.spot_count - 1) } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this spot. Try again.');
    }
  };

  const startEditingTitle = () => {
    if (!list) return;
    setTitleDraft(list.title);
    setIsEditingTitle(true);
    setError(null);
  };

  const handleSaveTitle = async () => {
    if (!listId || !titleDraft.trim() || isSavingTitle) return;
    setIsSavingTitle(true);
    setError(null);
    try {
      await updateList(session, listId, { title: titleDraft.trim() });
      setList((prev) => (prev ? { ...prev, title: titleDraft.trim() } : prev));
      setIsEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename this list. Try again.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteList = async () => {
    if (!listId || isDeletingList) return;
    if (!window.confirm('이 리스트를 삭제할까요? 안에 있는 스팟도 함께 삭제됩니다.')) return;
    setIsDeletingList(true);
    setError(null);
    try {
      await deleteList(session, listId);
      navigate(`/curator/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this list. Try again.');
      setIsDeletingList(false);
    }
  };

  if (loading) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!list) return <div className="px-4 py-10 text-sm text-miyeon-main/60">List not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <button
        onClick={() => navigate(`/curator/${id}`)}
        className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to profile
      </button>

      <div>
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="w-full rounded-full border border-miyeon-neutral bg-white px-3.5 py-1.5 font-display text-lg text-miyeon-main focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              disabled={isSavingTitle || !titleDraft.trim()}
              className="shrink-0 rounded-full bg-miyeon-sub1 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {isSavingTitle ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditingTitle(false)}
              className="shrink-0 rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-miyeon-main">{list.title}</h1>
            {isOwner && (
              <button
                onClick={startEditingTitle}
                aria-label="Rename list"
                className="text-miyeon-main/50 hover:text-miyeon-main"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {list.description && <p className="mt-1 text-sm text-miyeon-main/70">{list.description}</p>}
        <p className="mt-1 text-xs font-semibold text-miyeon-main/70">
          {list.spot_count} spot{list.spot_count === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/map?list=${list.id}`}
          className="flex items-center gap-1.5 rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main hover:border-miyeon-sub1/50"
        >
          <MapPin className="h-3.5 w-3.5" /> View on map
        </Link>
        {isOwner && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsPicking((prev) => !prev);
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-full bg-miyeon-sub1 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-miyeon-sub1/30"
          >
            <Plus className="h-3.5 w-3.5" /> Add spot
          </motion.button>
        )}
        {isOwner && (
          <button
            onClick={handleDeleteList}
            disabled={isDeletingList}
            className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> {isDeletingList ? 'Deleting…' : 'Delete list'}
          </button>
        )}
      </div>

      {isOwner && isPicking && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-miyeon-neutral bg-miyeon-neutral/20 p-3"
        >
          <PlaceSearchPicker
            onSelect={(place) => {
              setPendingPlace(place);
              setIsPicking(false);
            }}
            onClose={() => setIsPicking(false)}
          />
        </motion.div>
      )}

      {isOwner && pendingPlace && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2 rounded-2xl border border-miyeon-sub1/40 bg-white p-3"
        >
          <p className="text-sm font-semibold text-miyeon-main">Add "{pendingPlace.name}"</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a personal note (optional)…"
            rows={2}
            className="w-full resize-none rounded-xl border border-miyeon-neutral bg-white px-3 py-2 text-sm text-miyeon-main placeholder:text-miyeon-main/60 focus:outline-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <motion.button
              whileHover={isSaving ? undefined : { scale: 1.03 }}
              whileTap={isSaving ? undefined : { scale: 0.97 }}
              onClick={confirmAddSpot}
              disabled={isSaving}
              className="rounded-full bg-miyeon-sub1 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {isSaving ? 'Adding…' : 'Add to list'}
            </motion.button>
            <button
              onClick={() => {
                setPendingPlace(null);
                setNote('');
                setError(null);
              }}
              className="rounded-full border border-miyeon-neutral px-4 py-1.5 text-xs font-semibold text-miyeon-main"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {error && !pendingPlace && <p className="text-xs text-red-500">{error}</p>}

      {spots.length === 0 ? (
        <p className="text-sm text-miyeon-main/60">No spots in this list yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {spots.map((spot) => (
            <div key={spot.id} className="space-y-1.5">
              <div className="relative">
                <PlaceCard place={spot.place} onView={(place) => navigate(`/place/${place.id}`)} />
                {isOwner && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemove(spot.id)}
                    aria-label="Remove spot"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-miyeon-main shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
              {spot.note && <p className="px-1 text-xs italic text-miyeon-main/60">"{spot.note}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
