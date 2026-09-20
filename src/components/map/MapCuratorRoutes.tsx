import React from 'react';
import { Link } from 'react-router-dom';
import type { CreatorPick } from '../../types';
import { getStoredItinerary } from '../../lib/localItineraryStore';
import { itinerarySpotCount } from '../../services/itinerary/generate';

interface MapCuratorRoutesProps {
  picks: CreatorPick[];
}

const ITN_PICK_PREFIX = 'itn-pick-';

export const MapCuratorRoutes: React.FC<MapCuratorRoutesProps> = ({ picks }) => {
  const routes = picks
    .filter((pick) => pick.id.startsWith(ITN_PICK_PREFIX))
    .map((pick) => {
      const itineraryId = pick.id.slice(ITN_PICK_PREFIX.length);
      const itinerary = getStoredItinerary(itineraryId);
      if (!itinerary) return null;
      return {
        pick,
        itineraryId,
        stops: itinerarySpotCount(itinerary),
        priceUsd: itinerary.estimatedSpendUsd,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (routes.length === 0) return null;

  return (
    <section className="bg-white py-6">
      <div className="flex items-center justify-between px-5">
        <div>
          <p className="font-display text-lg font-bold text-miyeon-ink">Curator routes</p>
          <p className="text-xs text-miyeon-main/60">Follow someone who did it already.</p>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {routes.map(({ pick, itineraryId, stops, priceUsd }) => (
          <Link
            key={pick.id}
            to={`/itinerary/${itineraryId}`}
            className="w-[230px] shrink-0 overflow-hidden rounded-2xl border border-miyeon-line"
          >
            <img src={pick.place.photoUrl} alt="" className="h-[140px] w-full object-cover" />
            <div className="p-3.5">
              <div className="flex items-center gap-2">
                <img
                  src={pick.creator.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-miyeon-ink">{pick.creator.display_name}</p>
                  <p className="truncate text-[10px] text-miyeon-main/50">
                    @{pick.creator.username} · {pick.creator.picks_count} picks
                  </p>
                </div>
              </div>
              <p className="mt-2.5 font-display text-[15px] font-bold leading-snug text-miyeon-ink">
                {pick.personal_note}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="rounded-full bg-miyeon-accent-soft px-2 py-0.5 text-[9.5px] font-medium text-miyeon-accent-dark">
                  {stops} stop{stops === 1 ? '' : 's'}
                </span>
                {priceUsd > 0 && <span className="text-xs font-medium text-miyeon-ink">${priceUsd}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
