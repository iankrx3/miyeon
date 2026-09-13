import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface HomeCtaProps {
  onStartAnalysis: () => void;
}

export const HomeCta: React.FC<HomeCtaProps> = ({ onStartAnalysis }) => (
  <section className="bg-miyeon-sub2 px-5 py-16 pb-24 text-center sm:px-8 sm:py-20">
    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-miyeon-sub1">
      Still deciding?
    </p>
    <h2 className="mt-3 font-display text-3xl font-light leading-tight text-miyeon-main sm:text-4xl">
      Find your next,
      <br />
      better self.
    </h2>
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStartAnalysis}
      className="mt-8 inline-flex items-center gap-2 rounded-full bg-miyeon-ink px-6 py-3 text-sm font-semibold text-white"
    >
      Start my Glow Up
      <ArrowRight className="h-4 w-4" />
    </motion.button>
    <p className="mt-4 text-xs text-miyeon-main/45">Free. No account needed.</p>
  </section>
);
