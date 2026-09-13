import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export type GlowUpSubEntry = 'skin-concern' | 'real-korea';

interface HomeGlowUpEntriesProps {
  onComingSoon: (feature: GlowUpSubEntry) => void;
}

const entries: { id: GlowUpSubEntry; emoji: string; label: string; sub: string }[] = [
  {
    id: 'skin-concern',
    emoji: '💉',
    label: 'Just want to sort out a skin concern?',
    sub: 'What should I get?',
  },
  {
    id: 'real-korea',
    emoji: '🇰🇷',
    label: 'Curious about the real Korea, not tourist spots?',
    sub: 'Want the Real Korea?',
  },
];

export const HomeGlowUpEntries: React.FC<HomeGlowUpEntriesProps> = ({ onComingSoon }) => (
  <div className="bg-miyeon-ink px-5 pb-12 sm:px-8 sm:pb-16">
    <div className="mx-auto max-w-3xl space-y-2">
    {entries.map((entry) => (
      <motion.button
        key={entry.id}
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onComingSoon(entry.id)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2.5 text-xs text-white/70 sm:text-sm">
          <span className="text-base">{entry.emoji}</span>
          {entry.label}
          <span className="text-white/40">({entry.sub})</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
      </motion.button>
    ))}
    </div>
  </div>
);
