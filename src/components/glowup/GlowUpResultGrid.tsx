import React, { useState } from 'react';
import type { GlowUpDay, GlowUpPeriod, GlowUpSlot } from '../../types';

const PERIOD_LABEL: Record<GlowUpPeriod, string> = {
  morning: 'MORNING',
  afternoon: 'AFTERNOON',
  evening: 'EVENING',
};

const VISIBLE_CAP = 3;

const SlotCell: React.FC<{ slot: GlowUpSlot }> = ({ slot }) => {
  const [expanded, setExpanded] = useState(false);
  if (slot.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-miyeon-neutral px-3 py-3 text-center text-xs text-miyeon-main/40">
        Free time
      </div>
    );
  }

  const visible = expanded ? slot.items : slot.items.slice(0, VISIBLE_CAP);
  const hiddenCount = slot.items.length - visible.length;

  return (
    <div className="space-y-1.5">
      {visible.map((item, i) => (
        <div
          key={`${item.subtype}-${i}`}
          className="rounded-xl border border-miyeon-neutral bg-white px-3 py-2.5"
        >
          <p className="text-xs font-semibold text-miyeon-main">
            {item.emoji} {item.label}
          </p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[11px] font-bold text-miyeon-sub1"
            >
              View →
            </a>
          )}
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] font-semibold text-miyeon-main/60 underline"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  );
};

export const GlowUpResultGrid: React.FC<{ days: GlowUpDay[] }> = ({ days }) => (
  <div className="space-y-5">
    {days.map((day) => (
      <section key={day.dayIndex} className="rounded-3xl border border-miyeon-neutral p-4">
        <h3 className="mb-3 font-display text-lg text-miyeon-main">DAY {day.dayIndex}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {day.slots.map((slot) => (
            <div key={slot.period} className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-miyeon-main/45">
                {PERIOD_LABEL[slot.period]}
              </p>
              <SlotCell slot={slot} />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);
