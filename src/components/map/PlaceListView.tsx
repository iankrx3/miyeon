import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreatorPick, Place, UserSession } from '../../types';
import { fetchCuratedMapData } from '../../services/curator';
import { hasCreatripListing } from '../../lib/creatrip';
import { PlaceCard } from '../place/PlaceCard';
import { AdBadge, SponsoredPlaceCard } from '../place/SponsoredPlaceCard';
import { MapCuratorRoutes } from './MapCuratorRoutes';

export const PlaceListView: React.FC<{ session: UserSession }> = ({ session }) => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [picks, setPicks] = useState<CreatorPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCuratedMapData(session)
      .then(({ places: curatedPlaces, picks: curatedPicks }) => {
        setPlaces([...curatedPlaces].sort((a, b) => b.rating - a.rating));
        setPicks(curatedPicks);
      })
      .finally(() => setLoading(false));
  }, [session.creator?.id]);

  const viewPlace = (place: Place) => navigate(`/place/${place.id}`);

  if (loading) {
    return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  }
  if (places.length === 0) {
    return <div className="px-4 py-10 text-sm text-miyeon-main/60">No places found.</div>;
  }

  const sponsored = places.find(hasCreatripListing);
  const rest = sponsored ? places.filter((p) => p.id !== sponsored.id) : places;

  return (
    <div className="h-full overflow-y-auto pb-[calc(var(--bottom-nav-h)+64px)] sm:pb-20">
      <MapCuratorRoutes picks={picks} />

      <div className="mx-auto max-w-2xl px-4 py-4">
        {sponsored && (
          <div className="mb-4">
            <SponsoredPlaceCard place={sponsored} onView={viewPlace} />
          </div>
        )}

        <div className="space-y-4">
          {rest.map((place) => (
            <div key={place.id} className="relative">
              {hasCreatripListing(place) && (
                <div className="absolute left-2 top-2 z-10">
                  <AdBadge label="광고" />
                </div>
              )}
              <PlaceCard place={place} onView={viewPlace} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
