import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import bannerIllustration from '../../assets/home/banner-illustration.png';

interface HomeCtaProps {
  onStartAnalysis: () => void;
}

/** The illustration PNG has its own pink backdrop baked in, so the gradient behind it must sit exactly
 * where the Figma 400px frame puts it. A fluid full-width gradient shifts that backdrop and the image
 * edge shows — so the gradient is pinned to the right edge at 400px and the rest is its start colour. */
export const HomeCta: React.FC<HomeCtaProps> = ({ onStartAnalysis }) => (
  <section className="relative overflow-hidden bg-[#fef6f8]">
    <div
      aria-hidden
      className="absolute inset-y-0 right-0 w-[400px] bg-gradient-to-r from-[#fef6f8] via-[#f9d2dc] to-miyeon-accent"
    />
    <div className="relative flex items-center justify-between gap-2 py-6 pl-5">
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
    </div>
  </section>
);
