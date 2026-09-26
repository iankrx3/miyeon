import React, { useState } from 'react';
import type { GlowUpMixPreset } from '../../types';
import { MIX_LABEL } from '../../services/glowUp/routines';

interface TryAnotherMixProps {
  current: GlowUpMixPreset | null;
  changeNote: string | null;
  busy: boolean;
  onApply: (preset: GlowUpMixPreset) => void;
}

const PRESETS: GlowUpMixPreset[] = ['less-downtime', 'closer', 'lower-budget', 'iconic'];

/** Figma "Try another mix": pick what to change, then rebuild every routine around it. */
export const TryAnotherMix: React.FC<TryAnotherMixProps> = ({ current, changeNote, busy, onApply }) => {
  const [selected, setSelected] = useState<GlowUpMixPreset | null>(current);

  return (
    <section className="mx-5 rounded-[18px] bg-miyeon-accent-soft p-4">
      <h3 className="font-display text-[17px] font-medium text-miyeon-ink">Try another mix</h3>
      <p className="mt-1 text-[13px] text-miyeon-main/60">Change what matters and we&apos;ll rebuild your routines.</p>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={selected === preset}
            onClick={() => setSelected(selected === preset ? null : preset)}
            className={`rounded-full border px-3 py-3 text-[13.5px] transition-colors ${
              selected === preset
                ? 'border-miyeon-accent bg-white font-medium text-miyeon-accent-dark'
                : 'border-miyeon-line bg-white text-miyeon-main'
            }`}
          >
            {MIX_LABEL[preset]}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!selected || busy}
        onClick={() => selected && onApply(selected)}
        className="mt-3 w-full rounded-full bg-miyeon-ink py-[15px] text-[14.5px] font-medium text-white disabled:opacity-40"
      >
        {busy ? 'Rebuilding…' : 'See another version'}
      </button>
      {!selected && <p className="mt-2 text-center text-[11px] text-miyeon-main/45">Pick what to change first.</p>}
      {changeNote && (
        <p role="status" className="mt-3 rounded-[12px] bg-white px-3.5 py-2.5 text-[12.5px] leading-snug text-miyeon-main/80">
          {changeNote}
        </p>
      )}
    </section>
  );
};
