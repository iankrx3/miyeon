import React from 'react';

export const BUDGET_MIN_USD = 20;
export const BUDGET_MAX_USD = 500;
const STEP = 10;

interface BudgetSliderProps {
  /** Max price per experience in USD; null = no limit (also the untouched state). */
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Single-handle "up to $X per experience" slider. Pushing it to the end means no limit. */
export const BudgetSlider: React.FC<BudgetSliderProps> = ({ value, onChange }) => {
  const shown = value ?? BUDGET_MAX_USD;
  const pct = ((shown - BUDGET_MIN_USD) / (BUDGET_MAX_USD - BUDGET_MIN_USD)) * 100;
  const label = value == null ? 'No limit' : `Up to $${value}`;

  return (
    <div className="rounded-[14px] border border-miyeon-line bg-white px-[18px] pb-4 pt-5">
      <p className="text-center font-display text-[26px] font-bold leading-none text-miyeon-ink" aria-hidden>
        {label}
      </p>
      <p className="mt-1.5 text-center text-[11.5px] text-miyeon-main/55">per experience</p>

      <input
        type="range"
        min={BUDGET_MIN_USD}
        max={BUDGET_MAX_USD}
        step={STEP}
        value={shown}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(n >= BUDGET_MAX_USD ? null : n);
        }}
        aria-label="Maximum price per experience"
        aria-valuetext={label}
        className="budget-slider mt-5 w-full"
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />

      <div className="mt-1.5 flex justify-between text-[11px] text-miyeon-main/50">
        <span>${BUDGET_MIN_USD}</span>
        <span>No limit</span>
      </div>
    </div>
  );
};
