import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import heroAvatar1 from '../../assets/home/hero-avatar-1.png';
import heroAvatar2 from '../../assets/home/hero-avatar-2.png';
import heroAvatar3 from '../../assets/home/hero-avatar-3.png';
import heroAvatar4 from '../../assets/home/hero-avatar-4.png';
import decoBlob1 from '../../assets/home/hero-deco-blob-1.svg';
import decoBlob2 from '../../assets/home/hero-deco-blob-2.svg';
import decoSparkle1 from '../../assets/home/hero-deco-sparkle-1.svg';
import decoSparkle2 from '../../assets/home/hero-deco-sparkle-2.svg';
import decoSparkle3 from '../../assets/home/hero-deco-sparkle-3.svg';

interface HomeHeroProps {
  onStartAnalysis: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onStartAnalysis }) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-[#f9dde4] via-[#fce9ee] to-[#fef6f8] px-6 pb-8 pt-7 text-center sm:px-8 sm:py-24 lg:py-28">
    <div className="relative z-10 mx-auto max-w-3xl">
      <p className="font-display text-[10.5px] font-medium tracking-[0.2em] text-miyeon-accent sm:text-xs">
        FIRST TIME IN SEOUL?
      </p>
      <h1 className="mt-3.5 font-display leading-[1.2] text-miyeon-ink">
        <span className="block text-[31px] font-bold sm:text-5xl lg:text-[3.25rem]">K-Glow Up,</span>
        <span className="block text-[29px] font-light sm:text-5xl lg:text-[3.25rem]">only for you</span>
      </h1>
      <p className="mt-4 text-[13.5px] leading-[1.55] text-miyeon-main/70 sm:text-base">
        6 questions · 30 seconds
        <br />
        Leave Seoul as your best self
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartAnalysis}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-miyeon-ink py-[17px] pl-[34px] pr-7 text-[15px] font-medium text-white shadow-[0px_6px_16px_0px_rgba(90,81,77,0.22)]"
      >
        Start Glowing
        <ArrowRight className="h-4 w-4" />
      </motion.button>
      <div className="mt-5 flex items-center justify-center gap-2.5">
        <div className="flex -space-x-2">
          {[heroAvatar1, heroAvatar2, heroAvatar3, heroAvatar4].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-[22px] w-[22px] rounded-full object-cover ring-2 ring-[#fce9ee]"
            />
          ))}
        </div>
        <p className="text-xs text-miyeon-main/70">Used by 1,200+ travelers worldwide</p>
      </div>
    </div>

    <div className="pointer-events-none absolute inset-x-0 bottom-8 flex h-0 items-start justify-center sm:bottom-[-40px] sm:h-auto sm:opacity-80">
      <div className="relative h-[190px] w-[190px]">
        <img src={decoBlob1} alt="" className="absolute -left-[26.32%] -top-[26.32%] h-[152.64%] w-[152.64%] max-w-none" />
        <img src={decoBlob2} alt="" className="absolute left-[20px] top-0 h-[150px] w-[150px] max-w-none" />
        <img src={decoSparkle1} alt="" className="absolute left-[calc(50%-9px)] top-0 h-[18px] w-[18px]" />
        <img src={decoSparkle2} alt="" className="absolute left-[calc(50%-5.5px)] top-0 h-[11px] w-[11px]" />
        <img src={decoSparkle3} alt="" className="absolute left-[calc(50%-4.5px)] top-0 h-[9px] w-[9px]" />
      </div>
    </div>
  </section>
);
