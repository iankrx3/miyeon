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
          <div key={item.step} className="flex items-start gap-[13px]">
            <div
              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold ${
                item.step === 1
                  ? 'bg-miyeon-accent text-white'
                  : 'border border-miyeon-accent bg-white text-miyeon-accent'
              }`}
            >
              {item.step}
            </div>
            <div className="flex-1 rounded-[13px] border border-miyeon-line bg-white px-3.5 pb-[13px] pt-3">
              <div className="flex items-center gap-[7px]">
                <span className="rounded-full bg-miyeon-accent-soft px-[7px] py-[3px] text-[9px] font-bold tracking-[0.6px] text-miyeon-accent-dark">
                  {item.tag}
                </span>
                <p className="text-[14px] font-medium text-miyeon-ink">{item.title}</p>
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
        className="mt-[18px] flex w-full items-center justify-center gap-[7px] rounded-full border-[1.4px] border-miyeon-accent bg-white py-[15px] text-[14px] font-medium text-miyeon-accent-dark"
      >
        Build my plan
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  </section>
);
