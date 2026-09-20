import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Star } from 'lucide-react';
import type { Place, Treatment } from '../types';
import { fetchPlaceById, fetchTreatmentById } from '../services/places';
import { hasCreatripListing, withCreatripAffiliate, CREATRIP_DISCLOSURE } from '../lib/creatrip';
import { TreatmentExplainer } from '../components/treatment/TreatmentExplainer';

export default function TreatmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTreatmentById(id)
      .then(async (t) => {
        setTreatment(t);
        if (t) setPlace(await fetchPlaceById(t.placeId));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="px-5 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!treatment) return <div className="px-5 py-10 text-sm text-miyeon-main/60">Treatment not found.</div>;

  const bookingHref = place?.bookingUrl
    ? hasCreatripListing(place)
      ? withCreatripAffiliate(place.bookingUrl)
      : place.bookingUrl
    : undefined;

  return (
    <div className="pb-28">
      <div className="relative h-[280px] w-full overflow-hidden bg-miyeon-line">
        {place?.photoUrl && <img src={place.photoUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-miyeon-ink/75" />
        <Link
          to="/"
          className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-[7px] text-[11.5px] font-medium text-miyeon-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">{treatment.category}</p>
          <h1 className="mt-1.5 font-display text-[26px] font-bold leading-[1.2] text-white">{treatment.name}</h1>
        </div>
      </div>

      <div className="flex items-start px-5 py-5">
        <Stat value={`$${treatment.price.min}–${treatment.price.max}`} label="price" />
        {treatment.durationMinutes != null && <Stat value={`${treatment.durationMinutes}`} label="minutes" />}
        <Stat value={treatment.rating.toFixed(1)} label={`${treatment.reviewCount} reviews`} />
      </div>

      {bookingHref && (
        <div className="px-5 pb-5">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={bookingHref}
            target="_blank"
            rel="noreferrer"
            className="block rounded-full bg-miyeon-ink py-[15px] text-center text-[14.5px] font-medium text-white"
          >
            See options on Creatrip →
          </motion.a>
          <p className="mt-2 text-center text-[11px] text-miyeon-main/45">or keep reading below</p>
        </div>
      )}

      <div className="bg-miyeon-accent-soft px-6 py-7 text-center">
        <p className="flex items-center justify-center gap-1 text-[10px] font-medium tracking-[0.18em] text-miyeon-accent-dark">
          ✦ WHY THIS TREATMENT
        </p>
        <p className="mt-3 font-display text-xl font-bold leading-snug text-miyeon-ink">{treatment.expectedResult}</p>
      </div>

      <div className="px-5 py-6">
        <TreatmentExplainer treatment={treatment} />
      </div>

      <div className="px-5 pb-6">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">Best for</h2>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {treatment.concern.map((c) => (
            <span
              key={c}
              className="rounded-full bg-miyeon-surface px-2.5 py-1 text-[11px] font-medium text-miyeon-ink"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">Before you book</h2>
        <div className="mt-3 space-y-1.5 rounded-[14px] bg-miyeon-accent-soft p-4">
          {[
            `Downtime — ${treatment.downtime.replace(/-/g, ' ')}`,
            `Results show — ${treatment.resultTiming.replace(/-/g, ' ')}`,
            `Intensity — ${treatment.intensity}`,
            `Staff speak — ${treatment.language.join(', ')}`,
          ].map((line) => (
            <p key={line} className="flex gap-2 text-[12px] leading-relaxed text-miyeon-main/80">
              <span className="font-bold text-miyeon-accent-dark">•</span>
              {line}
            </p>
          ))}
        </div>
      </div>

      {place && (
        <div className="px-5 pb-6">
          <Link to={`/place/${place.id}`} className="block rounded-2xl border border-miyeon-line bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-miyeon-main/50">Available at</p>
            <p className="mt-1 text-[14.5px] font-medium text-miyeon-ink">{place.name}</p>
            <p className="text-xs text-miyeon-main/55">{place.area}</p>
          </Link>
        </div>
      )}

      {bookingHref && (
        <div className="px-5">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={bookingHref}
            target="_blank"
            rel="noreferrer"
            className="block rounded-full bg-miyeon-ink py-[15px] text-center text-[14.5px] font-medium text-white shadow-[0_6px_16px_rgba(207,63,97,0.22)]"
          >
            See options on Creatrip →
          </motion.a>
          {hasCreatripListing(place!) && (
            <p className="mt-2.5 text-center text-[10.5px] text-miyeon-main/45">{CREATRIP_DISCLOSURE}</p>
          )}
        </div>
      )}

      {bookingHref && (
        <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h)] z-30 flex items-center justify-between border-t border-miyeon-line bg-white px-5 py-3.5 shadow-[0_-3px_12px_rgba(0,0,0,0.07)] sm:bottom-0">
          <div>
            <p className="text-[15px] font-bold text-miyeon-ink">From ${treatment.price.min}</p>
            {place && <p className="text-[10.5px] text-miyeon-main/55">{place.area}</p>}
          </div>
          <a
            href={bookingHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-miyeon-ink px-[18px] py-3.5 text-sm font-medium text-white"
          >
            See options →
          </a>
        </div>
      )}
    </div>
  );
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-1 flex-col items-center gap-0.5"
  >
    <p className="flex items-center gap-1 font-display text-2xl font-bold text-miyeon-accent-dark">
      {label.includes('review') && <Star className="h-4 w-4 fill-miyeon-accent-dark" />}
      {value}
    </p>
    <p className="text-[11px] text-miyeon-main/60">{label}</p>
  </motion.div>
);
