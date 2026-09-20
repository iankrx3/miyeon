import React, { useState } from 'react';
import type { GlowUpDay, GlowUpPeriod, GlowUpSlot, GlowUpSlotItem } from '../../types';
import { getSpot } from '../../data/spots';

const PERIOD_LABEL: Record<GlowUpPeriod, string> = {
  morning: 'MORNING',
  afternoon: 'AFTERNOON',
  evening: 'EVENING',
};

const VISIBLE_CAP = 3;

const PlaceBlock: React.FC<{ item: GlowUpSlotItem; onOpenSpot?: (spotId: string) => void }> = ({
  item,
  onOpenSpot,
}) => {
  const spot = item.spotId ? getSpot(item.spotId) : undefined;
  return (
    <article className="rounded-xl border border-miyeon-neutral bg-white px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-sub1">
        {item.emoji} {item.label}
      </p>
      {spot ? (
        <button type="button" onClick={() => onOpenSpot?.(spot.id)} className="mt-0.5 w-full text-left">
          <h3 className="text-sm font-semibold text-miyeon-main">{spot.name}</h3>
          <p className="mt-0.5 text-[11px] text-miyeon-main/60">
            📍 {spot.area} · ⏱ {spot.durationMin} min
          </p>
        </button>
      ) : (
        <p className="mt-0.5 text-xs text-miyeon-main/60">We'll point you to live listings.</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-[11px] font-bold text-miyeon-sub1"
        >
          Find more on Creatrip →
        </a>
      )}
    </article>
  );
};

const SlotCell: React.FC<{ slot: GlowUpSlot; onOpenSpot?: (spotId: string) => void }> = ({ slot, onOpenSpot }) => {
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
        <PlaceBlock key={`${item.subtype}-${i}`} item={item} onOpenSpot={onOpenSpot} />
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

export const GlowUpResultGrid: React.FC<{ days: GlowUpDay[]; onOpenSpot?: (spotId: string) => void }> = ({
  days,
  onOpenSpot,
}) => (
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
              <SlotCell slot={slot} onOpenSpot={onOpenSpot} />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);
