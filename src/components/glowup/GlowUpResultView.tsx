import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GlowUpMixPreset, GlowUpStop, GlowUpSubtype, Itinerary } from '../../types';
import { budgetChipLabel, tripDaysLabel } from '../../data/glowUpQuiz';
import { addBackCategory, remixItinerary } from '../../services/glowUp/generate';
import { cityLabel } from '../../services/glowUp/routines';
import { useLang, useT } from '../../i18n';
import { RoutineMap } from './RoutineMap';
import { RoutineCard } from './RoutineCard';
import { TryAnotherMix } from './TryAnotherMix';
import { EmailCaptureInline } from './EmailCaptureInline';

interface GlowUpResultViewProps {
  itinerary: Itinerary;
  /** Persist an updated plan (after "See another version" / "Add"). */
  onUpdate: (next: Itinerary) => void;
  /** Signed-in user's email, pre-filled in the save form. */
  userEmail?: string;
}

const DOWNTIME_CHIP: Record<string, string> = {
  'no-daily-photos': 'No downtime',
  'day-or-two-ok': 'A day or two of downtime',
};

const chipClass = 'rounded-full bg-white/85 px-3 py-1.5 text-[12px] font-medium text-miyeon-main';

function pickLine(count: number): string {
  if (count <= 1) return "Here's your routine — it's your trip.";
  if (count === 2) return "Pick one or both — it's your trip.";
  if (count === 3) return "Pick one, two, or all three — it's your trip.";
  return "Pick what fits — it's your trip.";
}

const REASON_KEY: Record<string, string> = {
  'tight-trip': 'It works best on a day after your styling, and your trip is too tight. Still want it?',
  'no-venue': "We don't have a {label} we can book yet. Compare options on Creatrip.",
  'no-venue-budget': "We don't have a {label} we can book that fits your budget and language yet. Compare options on Creatrip.",
};

/** Figma "RESULT v2": map on top, then the Glow-up routines as tabs + swipeable cards. */
export const GlowUpResultView: React.FC<GlowUpResultViewProps> = ({ itinerary, onUpdate, userEmail }) => {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const plan = itinerary.glowUpV2;
  const profile = itinerary.glowUpSnapshot;
  const routines = plan?.routines ?? [];
  const [activeId, setActiveId] = useState(routines[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // A rebuilt plan may no longer have the routine that was selected.
  useEffect(() => {
    if (!routines.some((r) => r.id === activeId)) setActiveId(routines[0]?.id ?? '');
  }, [routines, activeId]);

  if (!plan || !profile) return null;

  const activeIndex = Math.max(0, routines.findIndex((r) => r.id === activeId));

  const selectRoutine = (id: string) => {
    setActiveId(id);
    const i = routines.findIndex((r) => r.id === id);
    const el = scrollerRef.current;
    if (el && i >= 0) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    const next = routines[i];
    if (next && next.id !== activeId) setActiveId(next.id);
  };

  const openStop = (stop: GlowUpStop) =>
    navigate(`/category/${stop.subtype}?place=${stop.place.id}`, { state: { fromItinerary: itinerary.id } });

  const run = async (job: () => Promise<Itinerary>) => {
    setBusy(true);
    try {
      onUpdate(await job());
    } finally {
      setBusy(false);
    }
  };

  const downtimeChip = profile.fix.downtime ? DOWNTIME_CHIP[profile.fix.downtime] : undefined;
  const budgetChip = budgetChipLabel(profile, t);
  const city = t(cityLabel(profile));

  return (
    <div className="mx-auto max-w-xl pb-6">
      <header className="bg-gradient-to-b from-[#f9dde4] to-[#fef6f8] px-5 pb-5 pt-5">
        <p className="text-[11px] font-medium tracking-[0.18em] text-miyeon-accent-dark">✦ {t('YOUR GLOW UP PLAN')}</p>
        <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.2] text-miyeon-ink">
          {t('{city} called,', { city })}
          <br />
          {t('your K-glow is on')}
        </h1>
        <p className="mt-2 text-[14px] text-miyeon-main/55">{t(pickLine(routines.length))}</p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <span className={chipClass}>
            {t('{city} · {days}', { city, days: t(tripDaysLabel(profile.tripDays)) })}
          </span>
          {budgetChip && <span className={chipClass}>{budgetChip}</span>}
          {downtimeChip && <span className={chipClass}>{downtimeChip}</span>}
        </div>
      </header>

      {routines.length > 0 ? (
        <>
          <RoutineMap
            routines={routines}
            activeId={activeId}
            onSelectRoutine={selectRoutine}
            onOpenStop={(rid, sid) => {
              const stop = routines.find((r) => r.id === rid)?.stops.find((s) => s.id === sid);
              if (stop) openStop(stop);
            }}
          />

          <div className="flex gap-2.5 overflow-x-auto px-5 py-4 no-scrollbar" role="tablist" aria-label={t('Routines')}>
            {routines.map((r) => {
              const active = r.id === activeId;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectRoutine(r.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[14px] ${
                    active ? 'bg-miyeon-ink font-medium text-white' : 'border border-miyeon-line bg-white text-miyeon-main'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${active ? 'bg-miyeon-accent' : 'bg-miyeon-line'}`} />
                  {t(r.tab)}
                </button>
              );
            })}
          </div>

          <div ref={scrollerRef} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar">
            {routines.map((r) => (
              <div key={r.id} className="w-full shrink-0 snap-center px-5 pb-1">
                <RoutineCard routine={r} profile={profile} onOpenStop={openStop} />
              </div>
            ))}
          </div>

          {routines.length > 1 && (
            <>
              <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
                {routines.map((r, i) => (
                  <span
                    key={r.id}
                    className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-[18px] bg-miyeon-accent' : 'w-1.5 bg-miyeon-line'}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-center text-[11.5px] text-miyeon-main/40">{t('← swipe to see your other routines →')}</p>
            </>
          )}
        </>
      ) : (
        <div className="mx-5 mt-5 rounded-[16px] border border-dashed border-miyeon-line px-5 py-8 text-center text-[13.5px] leading-snug text-miyeon-main/60">
          {t("We couldn't match any bookable place to your picks yet. The categories below still link to Creatrip.")}
        </div>
      )}

      <div className="mt-5 space-y-3 px-5">
        {plan.leftOut.map((item) => (
          <LeftOutCard
            key={item.subtype}
            label={t(item.label)}
            reason={
              item.reasonCode
                ? t(REASON_KEY[item.reasonCode], { label: lang === 'en' ? item.label.toLowerCase() : t(item.label) })
                : item.reason
            }
            canAdd={item.canAdd}
            url={item.url}
            busy={busy}
            onAdd={() => run(() => addBackCategory(itinerary, item.subtype as GlowUpSubtype))}
          />
        ))}
      </div>

      <div className="mt-5">
        <TryAnotherMix
          key={plan.mix ?? 'none'}
          current={plan.mix}
          changeNote={plan.changeNote}
          busy={busy}
          onApply={(preset: GlowUpMixPreset) => run(() => remixItinerary(itinerary, preset))}
        />
      </div>

      <EmailCaptureInline itinerary={itinerary} defaultEmail={userEmail} />
    </div>
  );
};

const LeftOutCard: React.FC<{
  label: string;
  reason: string;
  canAdd: boolean;
  url: string | null;
  busy: boolean;
  onAdd: () => void;
}> = ({ label, reason, canAdd, url, busy, onAdd }) => {
  const t = useT();
  return (
  <div className="flex items-start justify-between gap-3 rounded-[14px] border border-miyeon-line bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
    <div className="min-w-0">
      <p className="text-[14.5px] font-medium text-miyeon-ink">{t('We left out {label}', { label })}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-miyeon-main/55">{reason}</p>
    </div>
    {canAdd ? (
      <button
        type="button"
        disabled={busy}
        onClick={onAdd}
        className="shrink-0 pt-0.5 text-[14px] font-medium text-miyeon-accent-dark disabled:opacity-40"
      >
        {t('Add →')}
      </button>
    ) : (
      url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 pt-0.5 text-[14px] font-medium text-miyeon-accent-dark"
        >
          {t('Browse →')}
        </a>
      )
    )}
  </div>
  );
};
