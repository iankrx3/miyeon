import React from 'react';
import { Check } from 'lucide-react';
import type { GlowUpProfile } from '../../types';
import { budgetLabel, regionLabel } from '../../data/glowUpQuiz';

export const GlowUpCheckedFooter: React.FC<{ profile: GlowUpProfile }> = ({ profile }) => {
  const languages = profile.languages.length ? profile.languages.join(' · ') : 'No preference';

  const rows: { label: string; detail: string }[] = [
    { label: 'ORDER', detail: 'This sequence follows how each category actually behaves.' },
    { label: 'TIMING', detail: 'Placement accounts for the downtime you told us about.' },
    { label: 'YOUR FILTERS', detail: `${regionLabel(profile.region)} · ${budgetLabel(profile.budget)} · ${languages}` },
    { label: "WHAT'S REAL", detail: 'Filtered listings, not ads — checking real prices.' },
  ];

  return (
    <div className="rounded-3xl border border-miyeon-neutral bg-white p-5">
      <h3 className="font-display text-lg text-miyeon-main">MIYEON CHECKED.</h3>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-miyeon-sub1" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-main/45">{row.label}</p>
              <p className="text-sm text-miyeon-main">{row.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
