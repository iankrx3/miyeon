import React from 'react';
import { Info, MapPin, TriangleAlert } from 'lucide-react';
import type { GlowUpProfile, GlowUpRoutine, GlowUpStop } from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { labelForSubtype } from '../../data/glowUpQuiz';
import { checksFor, formatDuration, translateHint } from '../../services/glowUp/routines';
import { useT } from '../../i18n';

interface RoutineCardProps {
  routine: GlowUpRoutine;
  profile: GlowUpProfile | undefined;
  onOpenStop: (stop: GlowUpStop) => void;
}

/** Figma "루틴 카드": title, the categories in order, time/timing, downtime + area, numbered stops. */
export const RoutineCard: React.FC<RoutineCardProps> = ({ routine, profile, onOpenStop }) => {
  const t = useT();
  return (
  <div className="rounded-[18px] border-[1.5px] border-miyeon-accent bg-white p-4">
    <h3 className="flex items-center gap-2 font-display text-[21px] font-medium leading-tight text-miyeon-ink">
      <span aria-hidden className="text-[9px] text-miyeon-accent">
        ✦
      </span>
      {t(routine.title)}
    </h3>
    <p className="mt-1.5 text-[14px] text-miyeon-accent-dark">
      {routine.subtypes.map((s) => t(guideFor(s)?.name ?? labelForSubtype(s))).join(' → ')}
    </p>
    <p className="mt-2.5 text-[14px] text-miyeon-ink">
      <span className="font-medium">{formatDuration(routine.totalMinutes, t)}</span> · {t(routine.bestTiming)}
    </p>
    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-miyeon-main/55">
      <span>{t(routine.downtimeNote)}</span>
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3 text-miyeon-accent" aria-hidden />
        {routine.areaLabel}
      </span>
    </p>

    <ol className="mt-4 space-y-2.5">
      {routine.stops.map((stop, i) => (
        <StopRow key={stop.id} stop={stop} index={i} profile={profile} onOpen={() => onOpenStop(stop)} />
      ))}
    </ol>
  </div>
  );
};

const StopRow: React.FC<{ stop: GlowUpStop; index: number; profile: GlowUpProfile | undefined; onOpen: () => void }> = ({
  stop,
  index,
  profile,
  onOpen,
}) => {
  const guide = guideFor(stop.subtype);
  const t = useT();
  const { place } = stop;
  // "BEST" only when the venue data confirms (almost) everything we filter on.
  const best = checksFor(place, stop.subtype, profile).filter((c) => c.ok).length >= 3;
  const HintIcon = stop.hintTone === 'warn' ? TriangleAlert : Info;
  const product = place.products.find((p) => p.priceUsd)?.name ?? t(guide?.summary ?? labelForSubtype(stop.subtype));
  const name = place.branch && !place.name.toLowerCase().includes(place.branch.toLowerCase()) ? `${place.name} ${place.branch}` : place.name;

  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-3.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-miyeon-accent text-[12px] font-bold ${
          index === 0 ? 'bg-miyeon-accent text-white' : 'bg-white text-miyeon-accent'
        }`}
      >
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-miyeon-line bg-white p-2.5 text-left"
      >
        {guide?.image ? (
          <img src={guide.image} alt="" className="h-14 w-14 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span className="h-14 w-14 shrink-0 rounded-[10px] bg-miyeon-accent-soft" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 rounded bg-miyeon-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-miyeon-accent-dark">
              {stop.startTime}
            </span>
            <span className="truncate text-[15px] font-medium text-miyeon-ink">{name}</span>
            {best && (
              <span className="shrink-0 rounded bg-miyeon-accent px-1 py-0.5 text-[8.5px] font-bold tracking-wide text-white">
                {t('BEST')}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-miyeon-main/60">
            {product}
            {place.priceFromUsd != null ? ` · ~$${Math.round(place.priceFromUsd)}` : ''}
          </span>
          {stop.hint && (
            <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-miyeon-accent-dark">
              <HintIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{translateHint(stop.hint, t)}</span>
            </span>
          )}
        </span>
        <span className="shrink-0 text-lg text-miyeon-main/35" aria-hidden>
          ›
        </span>
      </button>
    </li>
  );
};
