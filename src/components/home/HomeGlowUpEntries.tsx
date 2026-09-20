import React from 'react';
import { motion } from 'motion/react';
import pillarFix from '../../assets/home/pillar-fix.jpg';
import pillarChange from '../../assets/home/pillar-change.jpg';
import pillarRestore from '../../assets/home/pillar-restore.jpg';

interface Pillar {
  id: 'fix' | 'change' | 'restore';
  label: string;
  meta: string;
  image: string;
}

const pillars: Pillar[] = [
  { id: 'fix', label: 'FIX', meta: 'Skin · Face', image: pillarFix },
  { id: 'change', label: 'CHANGE', meta: 'Hair · Color · Photo', image: pillarChange },
  { id: 'restore', label: 'RESTORE', meta: 'Spa · Massage', image: pillarRestore },
];

interface HomeGlowUpEntriesProps {
  onStartAnalysis: () => void;
}

export const HomeGlowUpEntries: React.FC<HomeGlowUpEntriesProps> = ({ onStartAnalysis }) => (
  <div className="bg-white pb-7 pt-[30px]">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
        YOU KNOW THE GOAL
      </p>
      <p className="mt-1 font-display text-[21px] text-miyeon-ink sm:text-2xl">We Make It Yours</p>
    </div>

    <div className="mt-4 flex gap-2.5 overflow-x-auto px-5 pb-2 no-scrollbar sm:px-8 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
      {pillars.map((pillar) => (
        <motion.button
          key={pillar.id}
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onStartAnalysis}
          className="relative h-[190px] w-[158px] shrink-0 overflow-hidden rounded-2xl text-left sm:w-full"
        >
          <img src={pillar.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-miyeon-ink/35 to-miyeon-ink/80" />
          <div className="absolute bottom-3.5 left-3.5 right-3.5">
            <p className="font-display text-base font-bold tracking-wide text-white">{pillar.label}</p>
            <p className="mt-0.5 text-[11px] text-white/80">{pillar.meta}</p>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);
