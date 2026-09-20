import React from 'react';
import { motion } from 'motion/react';
import type { BeautyCategory } from '../../types';
import { categoryMeta } from '../../data/mock';

interface CategoryRadialProps {
  categories?: BeautyCategory[];
  centerLabel?: string;
  onSelect: (category: BeautyCategory) => void;
}

const ALL_CATEGORIES = Object.keys(categoryMeta) as BeautyCategory[];

// §02-2 — Beauty Category icons arranged around a central hub. Trimmed to Skin/Face
// under Treatments; the full 5-way set stays available for a future Salon build.
export const CategoryRadial: React.FC<CategoryRadialProps> = ({
  categories = ALL_CATEGORIES,
  centerLabel = 'Explore',
  onSelect,
}) => {
  const radius = 128;
  const angleStep = (2 * Math.PI) / categories.length;

  return (
    <div className="relative mx-auto flex h-[340px] w-[340px] max-w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-miyeon-accent text-center text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-miyeon-accent/30"
      >
        {centerLabel}
      </motion.div>

      {categories.map((category, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const meta = categoryMeta[category];
        return (
          <motion.button
            key={category}
            onClick={() => onSelect(category)}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
            animate={{ opacity: 1, x, y, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 + i * 0.06 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.95 }}
            className="group absolute flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-miyeon-surface text-miyeon-main shadow-sm transition-colors hover:bg-miyeon-accent hover:text-white"
          >
            <span className="text-[11px] font-semibold">{meta.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
