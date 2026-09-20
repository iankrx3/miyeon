import React from 'react';
import { motion } from 'motion/react';

interface ChipProps {
  selected?: boolean;
  onClick: () => void;
  label: string;
}

export const Chip: React.FC<ChipProps> = ({ selected, onClick, label }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex-1 rounded-xl border px-3.5 py-[15px] text-center text-[13.5px] transition-colors ${
      selected
        ? 'border-[1.5px] border-miyeon-accent bg-miyeon-accent-soft font-medium text-miyeon-ink'
        : 'border-miyeon-line bg-white text-miyeon-ink hover:border-miyeon-accent/40'
    }`}
  >
    {label}
  </motion.button>
);
