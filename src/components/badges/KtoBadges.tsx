import React from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import type { MedicalTourismMatch, WellnessSpot } from '../../types';

// KTO source attribution + trust badges — PRD §7.2/§7.3.
// Both render nothing when their data is absent ("fail silent", §7.6) rather
// than showing a negative/"unverified" state.

export const WellnessPickBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-miyeon-surface px-2.5 py-1 text-[11px] font-medium text-miyeon-main">
    <Leaf className="h-3 w-3" />
    KTO Wellness Pick
  </span>
);

export const MedicalInfoBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-miyeon-surface px-2.5 py-1 text-[11px] font-medium text-miyeon-main">
    <ShieldCheck className="h-3 w-3" />
    Registered with Korea Medical Tourism Info (KTO)
  </span>
);

export const KtoSourceNote: React.FC = () => (
  <p className="text-[10px] text-miyeon-main/70">자료: 한국관광공사</p>
);

export const NearbyWellnessSection: React.FC<{ spots?: WellnessSpot[] }> = ({ spots }) => {
  if (!spots || spots.length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-miyeon-main">Nearby Wellness</h3>
        <WellnessPickBadge />
      </div>
      <div className="space-y-2">
        {spots.map((spot) => (
          <div key={spot.id} className="rounded-2xl border border-miyeon-line bg-white p-3">
            <p className="text-sm font-medium text-miyeon-main">{spot.name}</p>
            {spot.intro && <p className="mt-0.5 text-xs text-miyeon-main/70">{spot.intro}</p>}
            <p className="mt-1 text-[11px] text-miyeon-main/70">
              {spot.address}
              {spot.distanceKm != null ? ` · ${spot.distanceKm.toFixed(1)}km away` : ''}
            </p>
          </div>
        ))}
      </div>
      <KtoSourceNote />
    </section>
  );
};

export const MedicalTourismSection: React.FC<{ match?: MedicalTourismMatch }> = ({ match }) => {
  if (!match) return null;
  return (
    <section className="space-y-2">
      <MedicalInfoBadge />
      <p className="text-[11px] text-miyeon-main/60">
        {match.departments.join(', ')} · Supports {match.supportedLanguages.join(', ')}
      </p>
      <KtoSourceNote />
    </section>
  );
};
