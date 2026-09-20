import React from 'react';
import { Bookmark, ChevronLeft } from 'lucide-react';
import type { Itinerary, ItineraryDay } from '../../types';
import { budgetLabel, regionLabel } from '../../data/glowUpQuiz';
import { guideFor } from '../../data/categoryGuides';
import { GlowUpCategoryList } from './GlowUpCategoryList';

interface GlowUpResultViewProps {
  itinerary: Itinerary;
  day: ItineraryDay;
  onSelectDay: (dayIndex: number) => void;
  saved: boolean;
  onToggleSave: () => void;
  onBack: () => void;
}

const DOWNTIME_CHIP: Record<string, string> = {
  'no-daily-photos': 'No downtime',
  'day-or-two-ok': 'A day or two of downtime',
};

const CHECKED_LINES = [
  'Order — placed so nothing works against itself',
  'Timing — nothing overlaps',
  'Your filters — area, language',
  "What's real — filtered, not ads",
];

const chipClass = 'rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-miyeon-main';

/** Figma "RESULT — Day N": a category-based plan (no venues, no map). */
export const GlowUpResultView: React.FC<GlowUpResultViewProps> = ({
  itinerary,
  day,
  onSelectDay,
  saved,
  onToggleSave,
  onBack,
}) => {
  const profile = itinerary.glowUpSnapshot;
  const stops = day.blocks.filter((b) => b.glowUpSubtype);
  const firstGuide = stops[0]?.glowUpSubtype ? guideFor(stops[0].glowUpSubtype) : undefined;
  const downtimeChip = profile?.fix.downtime ? DOWNTIME_CHIP[profile.fix.downtime] : undefined;

  return (
    <div className="mx-auto max-w-xl pb-24 sm:pb-12">
      <header className="bg-gradient-to-b from-[#f9dde4] to-[#fef6f8] px-5 pb-5 pt-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-miyeon-main/70">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={onToggleSave}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold ${
              saved ? 'bg-miyeon-accent text-white' : 'bg-white/70 text-miyeon-ink'
            }`}
          >
            <Bookmark className="h-3 w-3" fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <p className="mt-3 text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent-dark">✦ YOUR GLOW UP PLAN</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold leading-[1.25] text-miyeon-ink">{itinerary.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile && <span className={chipClass}>{regionLabel(profile.region)}</span>}
          {profile?.budget && profile.budget !== 'no-preference' && (
            <span className={chipClass}>{budgetLabel(profile.budget)}</span>
          )}
          {downtimeChip && <span className={chipClass}>{downtimeChip}</span>}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 py-3.5 no-scrollbar">
        {itinerary.days.map((d) => (
          <button
            key={d.dayIndex}
            type="button"
            onClick={() => onSelectDay(d.dayIndex)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium ${
              d.dayIndex === day.dayIndex
                ? 'bg-miyeon-ink text-white'
                : 'border border-miyeon-line bg-miyeon-surface text-miyeon-main'
            }`}
          >
            Day {d.dayIndex}
          </button>
        ))}
      </div>

      <section className="px-5 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-medium text-miyeon-ink">{day.theme ?? `Day ${day.dayIndex}`}</h2>
          <p className="shrink-0 text-[13px] text-miyeon-main/50">
            {stops.length} stop{stops.length === 1 ? '' : 's'}
          </p>
        </div>
        {firstGuide && <p className="mt-1 text-[13px] text-miyeon-main/60">{firstGuide.orderNote}</p>}

        <div className="mt-4">
          <GlowUpCategoryList day={day} itineraryId={itinerary.id} />
        </div>

        <div className="mt-6 rounded-[14px] bg-miyeon-surface px-4 py-4">
          <p className="text-[10.5px] font-bold tracking-[0.16em] text-miyeon-accent-dark">MIYEON CHECKED</p>
          <ul className="mt-2 space-y-1.5">
            {CHECKED_LINES.map((line) => (
              <li key={line} className="flex gap-1.5 text-[11.5px] leading-relaxed text-miyeon-main/75">
                <span className="font-bold text-miyeon-accent">✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          className="mt-6 w-full rounded-full bg-miyeon-ink py-4 text-[14.5px] font-medium text-white"
        >
          {saved ? 'Saved' : 'Save this plan →'}
        </button>
      </section>
    </div>
  );
};
