import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { GlowUpSubEntry } from './HomeGlowUpEntries';

const COPY: Record<GlowUpSubEntry, { title: string; body: string }> = {
  'skin-concern': {
    title: 'What should I get?',
    body: "A quick, skin-concern-only quiz is coming soon. For now, try the full Glow Up quiz — it covers Skin and Face too.",
  },
  'real-korea': {
    title: 'Want the Real Korea?',
    body: 'A guide to Korea beyond the tourist spots is on the way. Check back soon.',
  },
};

interface ComingSoonOverlayProps {
  feature: GlowUpSubEntry | null;
  onClose: () => void;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ feature, onClose }) => (
  <AnimatePresence>
    {feature && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-miyeon-main/50 hover:text-miyeon-main"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-sub1">Coming soon</p>
          <h3 className="mt-2 font-display text-xl text-miyeon-main">{COPY[feature].title}</h3>
          <p className="mt-2 text-sm text-miyeon-main/70">{COPY[feature].body}</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
