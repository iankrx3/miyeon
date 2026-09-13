import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { aiTransitionMessages } from '../../data/quiz';

interface AITransitionProps {
  onDone: () => void;
  messages?: string[];
}

// §2-5 — short AI transition shown between PICK and Results.
export const AITransition: React.FC<AITransitionProps> = ({ onDone, messages = aiTransitionMessages }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= messages.length - 1) {
      const finish = setTimeout(onDone, 700);
      return () => clearTimeout(finish);
    }
    const next = setTimeout(() => setStep((s) => s + 1), 550);
    return () => clearTimeout(next);
  }, [step, onDone, messages.length]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-miyeon-sub1 text-white"
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="font-display text-xl text-miyeon-main"
        >
          {messages[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
