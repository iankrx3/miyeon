import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { Treatment } from '../../types';
import { getTreatmentExplanation } from '../../data/treatmentGlossary';

/**
 * "What is X?" — a static glossary lookup (no network call), revealed on
 * click. Renders nothing when the treatment isn't in the glossary, rather
 * than showing an empty or generic placeholder.
 */
export const TreatmentExplainer: React.FC<{ treatment: Treatment }> = ({ treatment }) => {
  const [open, setOpen] = useState(false);
  const explanation = getTreatmentExplanation(treatment);

  if (!explanation) return null;

  return (
    <section className="space-y-2">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-miyeon-line px-3.5 py-1.5 text-xs font-semibold text-miyeon-main hover:border-miyeon-accent/50"
        >
          <Info className="h-3.5 w-3.5" /> What is {treatment.name}?
        </button>
      )}

      {open && (
        <div className="space-y-1.5 rounded-2xl border border-miyeon-line bg-white p-3">
          <p className="text-sm font-semibold text-miyeon-main">What is {treatment.name}?</p>
          <p className="text-sm text-miyeon-main/80">{explanation}</p>
        </div>
      )}
    </section>
  );
};
