import React from 'react';
import { Sparkles } from 'lucide-react';

export const GlowUpWhyThis: React.FC<{ whyThisLine: string }> = ({ whyThisLine }) => (
  <div className="flex items-start gap-2.5 rounded-2xl border border-miyeon-neutral bg-miyeon-sub2/40 p-4">
    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-miyeon-sub1" />
    <p className="text-sm leading-snug text-miyeon-main">{whyThisLine}</p>
  </div>
);
