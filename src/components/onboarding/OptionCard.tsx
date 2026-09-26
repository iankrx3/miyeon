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
  /** Photo height in px for the image variant (Figma: 150 for Fix, Change and Restore). */
  imageHeight?: number;
  /** Denser text-only variant (downtime choices): 14px label, tighter padding. */
  compact?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  disabled,
  onClick,
  label,
  caption,
  image,
  headline,
  imageHeight = 150,
  compact,
}) => {
  if (image) {
    return (
      <motion.button
        type="button"
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className={`w-full overflow-hidden rounded-[14px] border text-left transition-colors ${
          selected ? 'border-miyeon-accent' : 'border-miyeon-line hover:border-miyeon-accent/40'
        }`}
      >
        <div className="w-full" style={{ height: imageHeight }}>
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-[3px] px-3 pb-[13px] pt-[11px]">
          <p className="text-[13px] font-medium leading-[1.36] text-miyeon-ink">{headline}</p>
          <p className="text-[10px] font-medium tracking-[0.4px] text-miyeon-accent">{label}</p>
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
      className={`w-full border px-[18px] text-left transition-colors ${
        compact ? 'rounded-[13px] py-[15px]' : 'rounded-[14px] py-4'
      } ${
        selected
          ? 'border-[1.5px] border-miyeon-accent bg-miyeon-accent-soft'
          : disabled
            ? 'border-miyeon-line bg-miyeon-line/30 text-miyeon-ink/30'
            : 'border-miyeon-line bg-white hover:border-miyeon-accent/40'
      }`}
    >
      <span className={`block font-medium text-miyeon-ink ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{label}</span>
      {caption && <span className="mt-1 block text-[11.5px] text-miyeon-main/55">{caption}</span>}
    </motion.button>
  );
};
