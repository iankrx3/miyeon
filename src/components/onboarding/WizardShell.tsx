import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

interface WizardShellProps {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: React.ReactNode;
}

export const WizardShell: React.FC<WizardShellProps> = ({
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
  children,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i < step ? 'w-4 bg-miyeon-sub1' : i === step - 1 ? 'w-6 bg-miyeon-sub1' : 'w-3 bg-miyeon-neutral'
            }`}
          />
        ))}
      </div>
    </div>
    <div>
      <h2 className="font-display text-2xl text-miyeon-main">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-miyeon-main/60">{subtitle}</p>}
    </div>
    {children}
    {onNext && (
      <motion.button
        type="button"
        whileHover={nextDisabled ? undefined : { scale: 1.02 }}
        whileTap={nextDisabled ? undefined : { scale: 0.97 }}
        onClick={onNext}
        disabled={nextDisabled}
        className="w-full rounded-full bg-miyeon-sub1 py-3.5 text-sm font-bold text-white shadow-sm shadow-miyeon-sub1/30 disabled:opacity-30"
      >
        {nextLabel}
      </motion.button>
    )}
  </div>
);
