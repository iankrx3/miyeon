import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guideFor } from '../../data/categoryGuides';
import { latestGlowUpPlan } from '../../lib/localItineraryStore';
import { readBookedStops, toggleBookedStop } from '../../lib/localBookedStops';

const MAX_ROWS = 4;

/** Figma MY → "my plan": the latest Glow Up plan at the top of the profile. */
export const MyGlowUpPlan: React.FC = () => {
  const navigate = useNavigate();
  const plan = useMemo(() => latestGlowUpPlan(), []);
  const [booked, setBooked] = useState<Set<string>>(readBookedStops);

  const stops = useMemo(
    () =>
      (plan?.days ?? []).flatMap((day) =>
        day.blocks
          .filter((b) => b.glowUpSubtype)
          .map((b) => ({
            id: b.id,
            dayIndex: day.dayIndex,
            name: guideFor(b.glowUpSubtype!)?.name ?? b.label ?? 'Stop',
          }))
      ),
    [plan]
  );

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[18px] font-bold text-miyeon-ink">My Glow Up Plan</h2>
        <Link to="/" className="text-[12px] font-medium text-miyeon-main/60 hover:text-miyeon-ink">
          Edit →
        </Link>
      </div>

      {!plan ? (
        <div className="mt-3.5 rounded-2xl border border-dashed border-miyeon-line px-4 py-8 text-center">
          <p className="text-sm text-miyeon-main/60">No plan yet.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 rounded-full bg-miyeon-ink px-4 py-2 text-xs font-medium text-white"
          >
            Plan a trip
          </button>
        </div>
      ) : (
        <div className="mt-3.5 rounded-[16px] bg-miyeon-accent-soft p-4">
          <div className="flex items-center justify-between text-[15px] font-bold">
            <p className="text-miyeon-ink">
              {plan.days.length} day{plan.days.length === 1 ? '' : 's'} · {stops.length} stop
              {stops.length === 1 ? '' : 's'}
            </p>
            {plan.estimatedSpendUsd > 0 && (
              <p className="text-miyeon-accent-dark">~${plan.estimatedSpendUsd}</p>
            )}
          </div>

          <ul className="mt-3 space-y-[9px]">
            {stops.slice(0, MAX_ROWS).map((stop) => {
              const isBooked = booked.has(stop.id);
              return (
                <li key={stop.id} className="flex items-center gap-[9px]">
                  <button
                    type="button"
                    aria-label={isBooked ? `Mark ${stop.name} as not booked` : `Mark ${stop.name} as booked`}
                    aria-pressed={isBooked}
                    onClick={() => setBooked(toggleBookedStop(stop.id))}
                    className="-m-2 shrink-0 p-2"
                  >
                    <span
                      className={`block h-4 w-4 rounded-full border-[1.5px] ${
                        isBooked ? 'border-miyeon-accent bg-miyeon-accent' : 'border-miyeon-line bg-white'
                      }`}
                    />
                  </button>
                  <span className="rounded-[4px] bg-white px-1.5 py-0.5 text-[8.5px] font-bold text-miyeon-accent-dark">
                    DAY {stop.dayIndex}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] font-medium ${
                      isBooked ? 'text-miyeon-ink' : 'text-miyeon-ink/55'
                    }`}
                  >
                    {stop.name}
                  </span>
                  <span
                    className={`shrink-0 text-[10.5px] font-medium ${
                      isBooked ? 'text-miyeon-accent-dark' : 'text-miyeon-main/45'
                    }`}
                  >
                    {isBooked ? 'Booked' : 'Not yet'}
                  </span>
                </li>
              );
            })}
          </ul>
          {stops.length > MAX_ROWS && (
            <p className="mt-2 text-[11px] text-miyeon-main/50">+{stops.length - MAX_ROWS} more in the full plan</p>
          )}

          <button
            type="button"
            onClick={() => navigate(`/itinerary/${plan.id}`)}
            className="mt-4 flex w-full items-center justify-center gap-[7px] rounded-full bg-miyeon-ink py-[13px] text-[13.5px] text-white"
          >
            <span className="font-medium">View full plan</span>
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </section>
  );
};
