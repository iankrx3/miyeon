import React from 'react';
import { motion } from 'motion/react';

interface WizardShellProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** 'primary' = dark filled pill (Next/See my Glow Up). 'skip' = light muted pill, no arrow. */
  nextVariant?: 'primary' | 'skip';
  children: React.ReactNode;
}

export const WizardShell: React.FC<WizardShellProps> = ({
  kicker,
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
  nextVariant = 'primary',
  children,
}) => (
  <div>
    <div className="flex items-center justify-between pb-5">
      <button type="button" onClick={onBack} className="text-[13px] text-miyeon-main/70">
        ‹ Back
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-[3px] rounded-full transition-all ${
              i + 1 === step ? 'w-5 bg-miyeon-accent' : i + 1 < step ? 'w-[11px] bg-miyeon-accent' : 'w-[11px] bg-miyeon-line'
            }`}
          />
        ))}
      </div>
    </div>

    {kicker && (
      <p className="flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] text-miyeon-accent">
        <span>✦</span>
        {kicker}
      </p>
    )}
    <h2 className={`font-display text-2xl font-medium text-miyeon-ink ${kicker ? 'mt-2' : ''}`}>{title}</h2>
    {subtitle && <p className="mt-2 text-[13.5px] leading-relaxed text-miyeon-main/60">{subtitle}</p>}

    <div className="mt-[22px]">{children}</div>

    {onNext && (
      <motion.button
        type="button"
        whileHover={nextDisabled ? undefined : { scale: 1.01 }}
        whileTap={nextDisabled ? undefined : { scale: 0.98 }}
        onClick={onNext}
        disabled={nextDisabled}
        className={`mt-5 w-full rounded-full py-[17px] text-[14.5px] font-medium disabled:opacity-30 ${
          nextVariant === 'skip'
            ? 'bg-miyeon-surface text-miyeon-main/85'
            : 'bg-miyeon-ink text-[15px] text-white shadow-[0_6px_16px_rgba(90,81,77,0.2)]'
        }`}
      >
        {nextVariant === 'skip' ? nextLabel : `${nextLabel} →`}
      </motion.button>
    )}
  </div>
);
