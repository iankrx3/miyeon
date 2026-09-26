import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useT } from '../../i18n';

interface PinkTransitionProps {
  title: string;
  body: string;
  chips: string[];
  onDone: () => void;
  /** How long the screen stays before moving on (tap skips). */
  durationMs?: number;
}

/** Figma "전환화면" — full-screen pink interstitial between quiz steps that reflects
 * the answers just given. Auto-advances; a tap moves on right away. */
export const PinkTransition: React.FC<PinkTransitionProps> = ({ title, body, chips, onDone, durationMs = 2200 }) => {
  const t = useT();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => doneRef.current(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="relative mx-auto flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h))] min-h-[520px] w-full max-w-xl flex-col overflow-hidden bg-gradient-to-b from-[#f7b3c6] via-[#fbd3de] to-[#fde9ee] px-5 text-left"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-30px] top-[130px] h-[190px] w-[190px] rounded-full bg-[#f28fac]/45 blur-[36px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-[22vh] flex flex-col items-center text-center"
      >
        <span aria-hidden className="mb-3 text-[9px] text-miyeon-accent">
          ✦
        </span>
        <h2 className="font-display text-[28px] font-bold leading-[1.2] text-miyeon-ink">{title}</h2>
        <p className="mt-4 max-w-[280px] text-[15px] leading-[1.45] text-miyeon-main/80">{body}</p>
        {chips.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-miyeon-accent-dark"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="absolute inset-x-0 bottom-[16%] flex flex-col items-center gap-2" aria-hidden>
        <div className="h-[3px] w-[120px] overflow-hidden rounded-full bg-white/60">
          <motion.div
            className="h-full rounded-full bg-miyeon-accent"
            initial={{ width: '0%' }}
            animate={{ width: '60%' }}
            transition={{ duration: durationMs / 1000, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[11px] text-miyeon-main/55">{t('moving on…')}</span>
      </div>
    </button>
  );
};
