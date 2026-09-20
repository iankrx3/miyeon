import React from 'react';
import { motion } from 'motion/react';
import type { VibePair } from '../../data/quiz';

interface PairChoiceProps {
  pair: VibePair;
  value?: string;
  onChange: (value: string) => void;
}

// §2-3 — "A vs B" vibe pair, three per screen.
export const PairChoice: React.FC<PairChoiceProps> = ({ pair, value, onChange }) => (
  <div className="relative grid grid-cols-2 gap-2">
    {[pair.a, pair.b].map((option) => (
      <motion.button
        key={option}
        onClick={() => onChange(option)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        animate={value === option ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl border px-3 py-4 text-sm font-medium transition-colors ${
          value === option
            ? 'border-miyeon-accent bg-miyeon-accent text-white shadow-sm shadow-miyeon-accent/25'
            : 'border-miyeon-line bg-white text-miyeon-main hover:border-miyeon-accent/50'
        }`}
      >
        {option}
      </motion.button>
    ))}
    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-miyeon-line bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-miyeon-main/70 shadow-sm">
      OR
    </span>
  </div>
);
