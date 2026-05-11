'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Coins, Banknote, Gem, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playBoxOpen } from '@/lib/audio/gameAudio';
import type { BoxReward, BoxType } from '@/types';
import { BOX_COLORS } from '@/types/victoryBox';

interface VictoryBoxOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: BoxReward[];
  boxType: BoxType;
}

function RewardIcon({ type }: { type: BoxReward['type'] }) {
  switch (type) {
    case 'coins': return <Coins className="w-6 h-6 text-amber-400" />;
    case 'cash': return <Banknote className="w-6 h-6 text-emerald-400" />;
    case 'spin': return <Star className="w-6 h-6 text-blue-400" />;
    case 'cue': return <Gem className="w-6 h-6 text-purple-400" />;
    case 'table': return <Gem className="w-6 h-6 text-pink-400" />;
    default: return <Sparkles className="w-6 h-6 text-slate-300" />;
  }
}

export function VictoryBoxOpenModal({ isOpen, onClose, rewards, boxType }: VictoryBoxOpenModalProps) {
  useEffect(() => {
    if (isOpen) {
      void playBoxOpen();
    }
  }, [isOpen]);

  const colors = BOX_COLORS[boxType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.3, opacity: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-sm bg-slate-900 rounded-3xl border-2 p-6 text-center overflow-hidden',
              colors.border
            )}
          >
            {/* Glow background */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-r',
                colors.bg
              )}
            />

            {/* Particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  scale: [0, 1, 0],
                }}
                transition={{ duration: 1 + Math.random(), delay: 0.2 + i * 0.05 }}
                className={cn(
                  'absolute top-1/2 left-1/2 w-2 h-2 rounded-full',
                  boxType === 'legendary' ? 'bg-amber-400' : boxType === 'epic' ? 'bg-purple-400' : 'bg-blue-400'
                )}
              />
            ))}

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Box icon burst */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className={cn(
                'w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl z-10 relative',
                colors.bg
              )}
            >
              <PackageIcon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn('text-xl font-black mb-1', colors.text)}
            >
              {boxType.charAt(0).toUpperCase() + boxType.slice(1)} Box
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-slate-400 mb-5"
            >
              Recompensas desbloqueadas!
            </motion.p>

            {/* Rewards list */}
            <div className="space-y-2 z-10 relative">
              {rewards.map((reward, i) => (
                <motion.div
                  key={`${reward.type}-${i}`}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <RewardIcon type={reward.type} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-bold">
                      {reward.name || reward.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reward.amount > 0 && `+${reward.amount.toLocaleString()}`}
                    </p>
                  </div>
                  {reward.rarity && (
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold',
                        reward.rarity === 'legendary' && 'text-amber-400',
                        reward.rarity === 'epic' && 'text-purple-400',
                        reward.rarity === 'rare' && 'text-blue-400'
                      )}
                    >
                      {reward.rarity}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Confirm button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={cn(
                'mt-5 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r',
                colors.bg,
                'shadow-lg'
              )}
            >
              Excelente!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
