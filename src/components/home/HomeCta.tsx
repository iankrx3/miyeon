import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import bannerIllustration from '../../assets/home/banner-illustration.png';

interface HomeCtaProps {
  onStartAnalysis: () => void;
}

export const HomeCta: React.FC<HomeCtaProps> = ({ onStartAnalysis }) => (
  <section className="flex items-center justify-between gap-2 overflow-hidden bg-gradient-to-r from-[#fef6f8] via-[#f9d2dc] to-miyeon-accent py-6 pl-5 sm:pl-8">
    <div className="min-w-0 flex-1">
      <p className="font-display text-[9.5px] font-medium tracking-[0.16em] text-miyeon-accent-dark">
        STILL SCROLLING?
      </p>
      <p className="mt-1.5 font-display text-[22px] font-bold leading-[1.24] text-miyeon-ink">
        Get Your
        <br />
        Beauty Plan
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartAnalysis}
        className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-miyeon-ink py-[11px] pl-[18px] pr-[15px] text-[12.5px] font-medium text-white"
      >
        Start my Glow Up
        <ArrowRight className="h-3.5 w-3.5" />
      </motion.button>
    </div>
    <img src={bannerIllustration} alt="" className="h-[150px] w-[191px] shrink-0 object-cover" />
  </section>
);
