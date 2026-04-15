'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LogOut, AlertTriangle, X, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameExitButtonProps {
  onExit: () => void;
  penalty?: number;
  className?: string;
}

export function GameExitButton({
  onExit,
  penalty = 100,
  className,
}: GameExitButtonProps) {
  const t = useTranslations('game');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    setShowConfirm(false);
    onExit();
  };

  return (
    <>
      {/* Exit Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-red-500/20 hover:bg-red-500/30',
          'text-red-400 text-sm font-medium',
          'transition-colors border border-red-500/30',
          className
        )}
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden landscape:inline">{t('exit')}</span>
      </motion.button>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t('exitConfirm')}
                  </h3>
                </div>
              </div>

              {/* Penalty Info */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-bold">
                    {t('exitPenalty')}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                  <span className="text-slate-400 text-sm">
                    {t('penaltyAmount')}
                  </span>
                  <span className="text-red-400 font-bold">
                    -{Math.floor(penalty * 0.5)} 🪙
                  </span>
                </div>
              </div>

              {/* Consequences */}
              <div className="space-y-1.5 mb-4">
                <p className="text-slate-400 text-xs">{t('exitConsequences')}:</p>
                <ul className="space-y-1">
                  {[t('consequenceLoss'), t('consequencePenalty')].map(
                    (item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-slate-300 text-xs"
                      >
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                >
                  {t('stay')}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className={cn(
                    'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
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
    </>
  );
}
