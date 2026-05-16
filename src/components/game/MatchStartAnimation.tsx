'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'zoom' | 'break' | 'done';

export function MatchStartAnimation() {
  const [phase, setPhase] = useState<Phase>('zoom');

  useEffect(() => {
    const breakTimer = window.setTimeout(() => setPhase('break'), 700);
    const doneTimer = window.setTimeout(() => setPhase('done'), 2100);
    return () => {
      clearTimeout(breakTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'break' ? 1 : 0.92 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-[1px]"
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{
              scale: phase === 'break' ? 1.08 : 1,
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: phase === 'break' ? [0, -2, 2, 0] : 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-black tracking-wide text-white drop-shadow-[0_0_24px_rgba(251,191,36,0.65)]"
            >
              {phase === 'break' ? 'BREAK!' : 'BOOL SINUCA'}
            </motion.div>
            <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: phase === 'break' ? '100%' : '55%' }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-red-500"
              />
            </div>
          </motion.div>
          {phase === 'break' && (
            <motion.div
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-white"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
