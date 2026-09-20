import React from 'react';
import { Sparkles } from 'lucide-react';

export const GlowUpWhyThis: React.FC<{ whyThisLine: string }> = ({ whyThisLine }) => (
  <div className="flex items-start gap-2.5 rounded-2xl border border-miyeon-line bg-miyeon-accent-soft/40 p-4">
    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-miyeon-accent" />
    <p className="text-sm leading-snug text-miyeon-main">{whyThisLine}</p>
  </div>
);
