'use client';

import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ForceLandscapeOverlayProps {
  isPortrait: boolean;
}

export function ForceLandscapeOverlay({ isPortrait }: ForceLandscapeOverlayProps) {
  const t = useTranslations('game');

  if (!isPortrait) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <Smartphone className="w-24 h-24 text-white" strokeWidth={1.5} />
      </motion.div>

      <motion.h2
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-2xl font-bold text-white mb-4 text-center"
      >
        {t('rotateDevice')}
      </motion.h2>

      <p className="text-gray-400 text-center px-8">
        {t('rotateInstructions')}
      </p>

      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-8"
      >
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
      </motion.div>
    </motion.div>
  );
}
