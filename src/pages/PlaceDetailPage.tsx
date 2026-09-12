import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, ChevronLeft, Navigation, Star } from 'lucide-react';
import type { CommunityPost, Place, Treatment } from '../types';
import { fetchPlaceById, fetchTreatments } from '../services/places';
import { fetchCommunityPosts } from '../services/community';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { MedicalTourismSection, NearbyWellnessSection } from '../components/badges/KtoBadges';
import { GroundedInfo } from '../components/place/GroundedInfo';
import { getDirectionsLinks } from '../lib/directions';
import { withCreatripAffiliate, CREATRIP_BASE_URL, CREATRIP_DISCLOSURE } from '../lib/creatrip';
import { getSpot, SUBCATEGORY_LABEL } from '../data/spots';

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromItinerary = (location.state as { fromItinerary?: string } | null)?.fromItinerary;
  const [place, setPlace] = useState<Place | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [reviews, setReviews] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedPlaces();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchPlaceById(id), fetchTreatments(), fetchCommunityPosts()])
      .then(([p, allTreatments, posts]) => {
        setPlace(p);
        setTreatments(allTreatments.filter((t) => p?.treatmentIds.includes(t.id)));
        setReviews(posts.filter((post) => post.placeId === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!place) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Place not found.</div>;

  return (
    <div className="mx-auto max-w-2xl pb-[var(--bottom-nav-h)] sm:pb-0">
      <motion.img
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        src={place.photoUrl}
        alt={place.name}
        className="h-64 w-full object-cover sm:h-80"
      />

      <div className="space-y-6 px-4 py-6">
        <Link
          to={fromItinerary ? `/itinerary/${fromItinerary}` : '/map'}
          className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {fromItinerary ? 'Back to itinerary' : 'Back to map'}
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-miyeon-main">{place.name}</h1>
            <p className="mt-1 text-xs text-miyeon-main/60">{place.address}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSave(place.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold ${
              isSaved(place.id) ? 'border-miyeon-sub1 bg-miyeon-sub1 text-white' : 'border-miyeon-neutral text-miyeon-main'
            }`}
          >
            <motion.span animate={isSaved(place.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
              <Bookmark className="h-3.5 w-3.5" fill={isSaved(place.id) ? 'currentColor' : 'none'} />
            </motion.span>
            {isSaved(place.id) ? 'Saved' : 'Save to My Map'}
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-miyeon-main">
          <span className="flex items-center gap-1 font-semibold">
            <Star className="h-4 w-4 fill-miyeon-sub1 text-miyeon-sub1" /> {place.rating}
          </span>
          <span className="text-miyeon-main/70">({place.reviewCount} reviews)</span>
          <span>·</span>
          <span>{place.priceRange}</span>
          <span>·</span>
          <span>{place.language.join(', ')}</span>
        </div>

        {(() => {
          const spot = getSpot(place.id);
          if (!spot) return null;
          return (
            <section className="rounded-2xl border border-miyeon-neutral bg-miyeon-neutral/40 p-4 text-sm text-miyeon-main">
              <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-sub1">
                {SUBCATEGORY_LABEL[spot.subcategory]}
              </p>
              <p className="mt-2">{spot.description}</p>
              <p className="mt-2 text-xs text-miyeon-main/70">
                ${spot.priceMin}–{spot.priceMax} (est.) · ~{spot.durationMin} min · {spot.languages.join(' · ')}
              </p>
            </section>
          );
        })()}

        <div className="flex flex-wrap gap-2">
          {getDirectionsLinks(place).map((link) => (
            <a
              key={link.provider}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-miyeon-neutral px-3.5 py-1.5 text-xs font-semibold text-miyeon-main hover:border-miyeon-sub1/50"
            >
              <Navigation className="h-3.5 w-3.5" /> {link.label}
            </a>
          ))}
        </div>

        {place.whyPeopleLikeIt && place.whyPeopleLikeIt.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-miyeon-main">Why people like it</h2>
            <ul className="mt-2 space-y-1 text-sm text-miyeon-main/80">
              {place.whyPeopleLikeIt.map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          </section>
        )}

        {treatments.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-miyeon-main">Treatments</h2>
            <div className="mt-2 space-y-2">
              {treatments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                >
                  <Link
                    to={`/treatment/${t.id}`}
                    className="flex items-center justify-between rounded-xl border border-miyeon-neutral px-3.5 py-3 text-sm transition-colors hover:border-miyeon-sub1/50"
                  >
                    <span className="font-medium text-miyeon-main">{t.name}</span>
                    <span className="text-xs text-miyeon-main/60">
                      ${t.price.min}–${t.price.max}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <NearbyWellnessSection spots={place.nearbyWellness} />
        <MedicalTourismSection match={place.medicalTourismMatch} />
        <GroundedInfo place={place} />

        {reviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-miyeon-main">Community Reviews</h2>
            <div className="mt-2 space-y-2">
              {reviews.map((r) => (
                <Link
                  key={r.id}
                  to={`/community/${r.id}`}
                  className="block rounded-xl border border-miyeon-neutral px-3.5 py-3 text-sm text-miyeon-main/80 hover:border-miyeon-sub1/50"
                >
                  <p className="font-medium text-miyeon-main">{r.authorName}</p>
                  <p className="mt-1">{r.text}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-1.5">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={withCreatripAffiliate(place.bookingUrl || CREATRIP_BASE_URL)}
            target="_blank"
            rel="noreferrer"
            className="block rounded-full bg-miyeon-sub1 py-3.5 text-center text-sm font-bold text-white shadow-sm shadow-miyeon-sub1/30"
          >
            BOOK WITH CREATRIP →
          </motion.a>
          <p className="text-center text-[10px] text-miyeon-main/60">{CREATRIP_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}
