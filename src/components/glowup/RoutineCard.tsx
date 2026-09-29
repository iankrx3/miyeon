import React from 'react';
import type { GlowUpRoutine, GlowUpStop } from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { labelForSubtype } from '../../data/glowUpQuiz';
import { STAGE_LABEL } from '../../data/glowUpRoutines';
import { formatDuration, isClinicSubtype, translateHint } from '../../services/glowUp/routines';
import { useT } from '../../i18n';

interface RoutineCardProps {
  routine: GlowUpRoutine;
  onOpenStop: (stop: GlowUpStop) => void;
}

/** Figma V2.2 "routine card": stage badge → name → one-line promise → categories in order → time,
 * context line + area → numbered stops. */
export const RoutineCard: React.FC<RoutineCardProps> = ({ routine, onOpenStop }) => {
  const t = useT();
  return (
    <div className="rounded-[18px] border-[1.5px] border-miyeon-accent bg-white p-4">
      <span className="inline-block rounded-full bg-miyeon-ink px-3 py-1 text-[10.5px] font-bold tracking-[0.16em] text-white">
        {t(STAGE_LABEL[routine.stage])}
      </span>
      <h3 className="mt-3 flex items-center gap-2 font-display text-[21px] font-medium leading-tight text-miyeon-ink">
        <span aria-hidden className="text-[9px] text-miyeon-accent">
          ✦
        </span>
        {t(routine.title)}
      </h3>
      <p className="mt-2.5 rounded-[8px] border-l-[3px] border-miyeon-accent bg-miyeon-accent-soft px-3 py-2 text-[14.5px] leading-snug text-miyeon-ink">
        {t(routine.promise)}
      </p>
      <p className="mt-3 text-[14px] text-miyeon-accent-dark">
        {routine.subtypes.map((s) => t(guideFor(s)?.name ?? labelForSubtype(s))).join(' → ')}
      </p>
      <p className="mt-2 text-[14px] text-miyeon-ink">
        <span className="font-medium">{formatDuration(routine.totalMinutes, t)}</span> · {t(routine.timeOfDay)}
      </p>
      <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-miyeon-main/55">
        {routine.note && <span>{t(routine.note)}</span>}
        <span>{routine.areaLabel}</span>
      </p>
      {routine.timingNote && <p className="mt-1.5 text-[12px] leading-snug text-miyeon-accent-dark">{t(routine.timingNote)}</p>}

      <ol className="mt-4 space-y-2.5">
        {routine.stops.map((stop, i) => (
          <StopRow key={stop.id} stop={stop} index={i} onOpen={() => onOpenStop(stop)} />
        ))}
      </ol>
    </div>
  );
};

const StopRow: React.FC<{ stop: GlowUpStop; index: number; onOpen: () => void }> = ({ stop, index, onOpen }) => {
  const guide = guideFor(stop.subtype);
  const t = useT();
  const { place } = stop;
  const name = place.branch && !place.name.toLowerCase().includes(place.branch.toLowerCase()) ? `${place.name} ${place.branch}` : place.name;
  const price =
    isClinicSubtype(stop.subtype) || place.priceType === 'free'
      ? t('Free reservation')
      : place.priceFromUsd != null
        ? `~$${Math.round(place.priceFromUsd)}`
        : null;

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
            {stop.best && (
              <span className="shrink-0 rounded bg-miyeon-accent px-1 py-0.5 text-[8.5px] font-bold tracking-wide text-white">
                {t('BEST')}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-miyeon-main/60">
            {t(guide?.name ?? labelForSubtype(stop.subtype))}
            {price ? ` · ${price}` : ''}
          </span>
          {stop.hint && (
            <span
              className={`mt-0.5 block text-[11.5px] leading-snug ${
                stop.hintTone === 'warn' ? 'text-miyeon-accent-dark' : 'text-miyeon-accent'
              }`}
            >
              {translateHint(stop.hint, t)}
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
