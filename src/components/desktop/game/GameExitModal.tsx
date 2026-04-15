'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AlertTriangle, X, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  penalty?: number;
}

export function GameExitModal({
  isOpen,
  onClose,
  onConfirm,
  penalty = 100,
}: GameExitModalProps) {
  const t = useTranslations('game');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t('exitConfirm')}
                  </h3>
                  <p className="text-slate-400 text-sm">{t('exitWarning')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Penalty Info */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold">
                  {t('exitPenalty')}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                {t('exitPenaltyDesc')}
              </p>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-slate-400">{t('penaltyAmount')}</span>
                <span className="text-red-400 font-bold text-lg">
                  -{Math.floor(penalty * 0.5)} {t('coins')}
                </span>
              </div>
            </div>

            {/* Consequences */}
            <div className="space-y-2 mb-6">
              <p className="text-slate-400 text-sm">{t('exitConsequences')}:</p>
              <ul className="space-y-2">
                {[
                  t('consequenceLoss'),
                  t('consequencePenalty'),
                  t('consequenceStats'),
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-slate-300 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                {t('stay')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-medium transition-colors',
                  'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                {t('exitAnyway')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
