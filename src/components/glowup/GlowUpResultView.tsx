import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GlowUpMixPreset, GlowUpStop, GlowUpTiming, Itinerary } from '../../types';
import { budgetChipLabel, tripDaysLabel } from '../../data/glowUpQuiz';
import { remixItinerary } from '../../services/glowUp/generate';
import { TIMING_LABEL } from '../../data/glowUpRoutines';
import { cityLabel, groupByTiming, isClinicSubtype, shortRegion } from '../../services/glowUp/routines';
import { useLang } from '../../i18n';
import { RoutineMap } from './RoutineMap';
import { AftercareProducts } from './AftercareProducts';
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
  'day-or-two-ok': '1–2 days OK',
};

const chipClass = 'rounded-full bg-white/85 px-3 py-1.5 text-[12px] font-medium text-miyeon-main';

function pickLine(count: number): string {
  if (count <= 1) return "Here's your routine — it's your trip.";
  if (count === 2) return "Pick one or both — it's your trip.";
  if (count === 3) return "Pick one, two, or all three — it's your trip.";
  return "Pick what fits — it's your trip.";
}

/** Figma "V2.2 RESULT": map on top, then "when" chips (First days / Mid-trip / Last days / Any night);
 * each chip's panel stacks that timing's routine cards, and the panels swipe sideways. */
export const GlowUpResultView: React.FC<GlowUpResultViewProps> = ({ itinerary, onUpdate, userEmail }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const plan = itinerary.glowUpV2;
  const profile = itinerary.glowUpSnapshot;
  const routines = plan?.routines ?? [];
  const groups = useMemo(() => groupByTiming(routines), [routines]);
  const [active, setActive] = useState<GlowUpTiming | undefined>(groups[0]?.timing);
  const [busy, setBusy] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // A rebuilt plan may no longer have the timing that was selected.
  useEffect(() => {
    if (!groups.some((g) => g.timing === active)) setActive(groups[0]?.timing);
  }, [groups, active]);

  // The routine panels sit side by side in one flex row so they can swipe horizontally; without
  // this, the row's height (and the gap before the caption below it) would default to the
  // tallest panel (several routines + the Amazon shelf) even while a shorter one is showing.
  useEffect(() => {
    const el = active ? panelRefs.current[active] : null;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPanelHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  const activeIds = useMemo(() => groups.find((g) => g.timing === active)?.routines.map((r) => r.id) ?? [], [groups, active]);

  if (!plan || !profile) return null;

  const activeIndex = Math.max(0, groups.findIndex((g) => g.timing === active));

  const selectTiming = (timing: GlowUpTiming) => {
    setActive(timing);
    const i = groups.findIndex((g) => g.timing === timing);
    const el = scrollerRef.current;
    if (el && i >= 0) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const selectRoutine = (id: string) => {
    const timing = routines.find((r) => r.id === id)?.timing;
    if (timing) selectTiming(timing);
  };

  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    const next = groups[i];
    if (next && next.timing !== active) setActive(next.timing);
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
          {downtimeChip && <span className={chipClass}>{t(downtimeChip)}</span>}
        </div>
        {plan.anchorRegion && (
          <p className="mt-3 text-[12.5px] leading-snug text-miyeon-main/60">
            {t('We based you in {area} — most options for what you picked.', { area: t(shortRegion(plan.anchorRegion)) })}
          </p>
        )}
      </header>

      {routines.length > 0 ? (
        <>
          <RoutineMap
            routines={routines}
            activeIds={activeIds}
            onSelectRoutine={selectRoutine}
            onOpenStop={(rid, sid) => {
              const stop = routines.find((r) => r.id === rid)?.stops.find((s) => s.id === sid);
              if (stop) openStop(stop);
            }}
          />

          <div className="flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar" role="tablist" aria-label={t('When in your trip')}>
            {groups.map((g) => {
              const on = g.timing === active;
              return (
                <button
                  key={g.timing}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => selectTiming(g.timing)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] ${
                    on ? 'bg-miyeon-ink font-medium text-white' : 'border border-miyeon-line bg-white text-miyeon-main'
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${on ? 'bg-miyeon-accent' : 'bg-miyeon-line'}`} />
                  {t(TIMING_LABEL[g.timing])}
                </button>
              );
            })}
          </div>

          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="flex items-start snap-x snap-mandatory overflow-x-auto no-scrollbar"
            style={panelHeight ? { height: panelHeight } : undefined}
          >
            {groups.map((g) => (
              <div
                key={g.timing}
                ref={(el) => {
                  panelRefs.current[g.timing] = el;
                }}
                className="w-full shrink-0 snap-center space-y-4 px-5"
              >
                {g.routines.map((r) => (
                  <div key={r.id}>
                    <RoutineCard routine={r} onOpenStop={openStop} />
                    {r.stops.some((s) => isClinicSubtype(s.subtype)) && <AftercareProducts />}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {groups.length > 1 && (
            <>
              <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
                {groups.map((g, i) => (
                  <span
                    key={g.timing}
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
