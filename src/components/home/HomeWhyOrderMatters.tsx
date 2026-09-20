import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Step {
  step: number;
  tag: string;
  title: string;
  caption: string;
}

const steps: Step[] = [
  { step: 1, tag: 'TRIP', title: 'Where, How long', caption: 'So every day counts.' },
  { step: 2, tag: 'LIMITS', title: 'Budget, Downtime, Language', caption: 'So your limits don’t limit.' },
  { step: 3, tag: 'GOAL', title: 'What You Want', caption: 'So we work backwards.' },
];

interface HomeWhyOrderMattersProps {
  onStartAnalysis: () => void;
}

export const HomeWhyOrderMatters: React.FC<HomeWhyOrderMattersProps> = ({ onStartAnalysis }) => (
  <section className="bg-miyeon-surface px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-3xl">
      <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
        WHY MIYEON?
      </p>
      <p className="mt-1.5 font-display text-[21px] font-bold text-miyeon-ink">It’s All About You</p>
      <p className="mt-1.5 text-[12.5px] text-miyeon-main/60">Your trip, limits, goals — all considered</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {steps.map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <div
              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold ${
                item.step === 1
                  ? 'bg-miyeon-accent text-white'
                  : 'bg-miyeon-accent-soft text-miyeon-accent'
              }`}
            >
              {item.step}
            </div>
            <div className="flex-1 rounded-2xl border border-miyeon-line bg-white px-3.5 pb-3.5 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-miyeon-accent-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-miyeon-accent-dark">
                  {item.tag}
                </span>
                <p className="text-sm font-medium text-miyeon-ink">{item.title}</p>
              </div>
              <p className="mt-0.5 text-[11.5px] text-miyeon-main/60">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartAnalysis}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border-[1.4px] border-miyeon-accent bg-white py-[15px] text-sm font-medium text-miyeon-accent-dark"
      >
        Build my plan
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  </section>
);
