import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface HomeHeroProps {
  onStartAnalysis: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onStartAnalysis }) => (
  <section className="bg-miyeon-ink px-5 py-16 text-center sm:px-8 sm:py-24 lg:py-28">
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-miyeon-sub1">
        Meet your Miyeon.
      </p>
      <h1 className="mt-4 font-display text-[2rem] font-light leading-[1.15] tracking-tight text-miyeon-neutral sm:text-5xl lg:text-[3.5rem]">
        Tell me about your trip.
      </h1>
      <p className="mt-4 text-sm text-white/55 sm:text-base">
        I’ll figure out the beauty part.
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartAnalysis}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-miyeon-ink shadow-sm"
      >
        Plan my trip
        <ArrowRight className="h-4 w-4" />
      </motion.button>
      <div className="mt-8 flex items-center justify-center gap-3">
        <div className="flex -space-x-1.5">
          <span className="h-6 w-6 rounded-full bg-[#f3d4ce] ring-2 ring-miyeon-ink" />
          <span className="h-6 w-6 rounded-full bg-[#c98984] ring-2 ring-miyeon-ink" />
          <span className="h-6 w-6 rounded-full bg-[#e8b9b2] ring-2 ring-miyeon-ink" />
        </div>
        <p className="text-xs text-white/55 sm:text-sm">Takes about 2 minutes</p>
      </div>
    </div>
  </section>
);
