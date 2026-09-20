import React from 'react';
import { motion } from 'motion/react';

interface OptionCardProps {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  /** Small caption line under the label (budget tiers, downtime, "No, English is fine"). */
  caption?: string;
  /** Photo card variant (Fix/Change/Restore): headline over an image, label as the pink category line. */
  image?: string;
  headline?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  disabled,
  onClick,
  label,
  caption,
  image,
  headline,
}) => {
  if (image) {
    return (
      <motion.button
        type="button"
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className={`w-full overflow-hidden rounded-2xl border text-left transition-colors ${
          selected ? 'border-miyeon-accent' : 'border-miyeon-line hover:border-miyeon-accent/40'
        }`}
      >
        <div className="aspect-[168/100] w-full sm:aspect-[168/150]">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="px-3 pb-3.5 pt-2.5">
          <p className="text-[13px] leading-snug text-miyeon-ink">{headline}</p>
          <p className="mt-0.5 text-[10px] font-medium tracking-wide text-miyeon-accent">{label}</p>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl border px-[18px] py-4 text-left transition-colors ${
        selected
          ? 'border-[1.5px] border-miyeon-accent bg-miyeon-accent-soft'
          : disabled
            ? 'border-miyeon-line bg-miyeon-line/30 text-miyeon-ink/30'
            : 'border-miyeon-line bg-white hover:border-miyeon-accent/40'
      }`}
    >
      <span className="block text-[15px] font-medium text-miyeon-ink">{label}</span>
      {caption && <span className="mt-1 block text-[11.5px] text-miyeon-main/55">{caption}</span>}
    </motion.button>
  );
};
