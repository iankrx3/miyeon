import React from 'react';
import { motion } from 'motion/react';

interface OptionCardProps {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  emoji?: string;
  label: string;
  large?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  disabled,
  onClick,
  emoji,
  label,
  large,
}) => (
  <motion.button
    type="button"
    whileHover={disabled ? undefined : { scale: 1.02 }}
    whileTap={disabled ? undefined : { scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={`w-full rounded-2xl border px-4 text-left transition-colors ${
      large ? 'py-4' : 'py-3.5'
    } ${
      selected
        ? 'border-miyeon-sub1 bg-miyeon-sub2 text-miyeon-main'
        : disabled
          ? 'border-miyeon-neutral bg-miyeon-neutral/40 text-miyeon-main/30'
          : 'border-miyeon-neutral bg-white text-miyeon-main hover:border-miyeon-sub1/50'
    }`}
  >
    <span className={`flex items-center gap-3 ${large ? 'font-display text-lg' : 'text-sm font-semibold'}`}>
      {emoji && <span className="text-xl">{emoji}</span>}
      <span>{label}</span>
    </span>
  </motion.button>
);
