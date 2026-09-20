import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, Star } from 'lucide-react';
import type { Place } from '../../types';
import { categoryMeta } from '../../data/mock';
import { MedicalInfoBadge, WellnessPickBadge } from '../badges/KtoBadges';

interface PlaceCardProps {
  place: Place;
  saved?: boolean;
  onSave?: (id: string) => void;
  onView?: (place: Place) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, saved, onSave, onView }) => {
  const meta = categoryMeta[place.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl border border-miyeon-line bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-miyeon-main/10"
    >
      <button onClick={() => onView?.(place)} className="block w-full overflow-hidden text-left">
        <motion.img
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          src={place.photoUrl}
          alt={place.name}
          className="h-36 w-full object-cover"
        />
      </button>
      <div className="space-y-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-miyeon-accent">
              {meta.label} · {place.area}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-miyeon-main">{place.name}</h3>
          </div>
          {onSave && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onSave(place.id)}
              aria-label="Save to My Map"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                saved ? 'border-miyeon-accent bg-miyeon-accent text-white' : 'border-miyeon-line text-miyeon-main'
              }`}
            >
              <motion.span animate={saved ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
                <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
              </motion.span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-miyeon-main/80">
          <span className="flex items-center gap-0.5 font-semibold text-miyeon-main">
            <Star className="h-3 w-3 fill-miyeon-accent text-miyeon-accent" /> {place.rating}
          </span>
          <span>({place.reviewCount})</span>
          <span>·</span>
          <span>{place.priceRange}</span>
          <span>·</span>
          <span className="truncate">{place.representativeTreatment}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {place.aiPick && <Pill label="AI Pick" />}
          {place.creatorPick && <Pill label="Creator Pick" />}
          {place.communityPick && <Pill label="Community Pick" />}
          {place.nearbyWellness?.length ? <WellnessPickBadge /> : null}
          {place.medicalTourismMatch ? <MedicalInfoBadge /> : null}
        </div>
      </div>
    </motion.div>
  );
};

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className="rounded-full bg-miyeon-ink/10 px-2.5 py-1 text-[11px] font-medium text-miyeon-main">
    {label}
  </span>
);
