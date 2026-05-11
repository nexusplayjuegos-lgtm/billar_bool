'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playRewardClaim } from '@/lib/audio/gameAudio';
import type { SeasonReward } from '@/types';

interface PoolPassClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: SeasonReward | null;
  rank: number;
  rewardType: 'free' | 'premium' | 'elite';
}

const typeConfig = {
  free: { label: 'Grátis', color: 'from-slate-400 to-slate-500', badge: 'bg-slate-600' },
  premium: { label: 'Premium', color: 'from-amber-400 to-amber-600', badge: 'bg-amber-500' },
  elite: { label: 'Elite', color: 'from-purple-400 to-purple-600', badge: 'bg-purple-500' },
};

const rarityConfig = {
  common: { border: 'border-slate-500', glow: 'shadow-slate-500/30' },
  rare: { border: 'border-blue-500', glow: 'shadow-blue-500/30' },
  epic: { border: 'border-purple-500', glow: 'shadow-purple-500/30' },
  legendary: { border: 'border-amber-500', glow: 'shadow-amber-500/30' },
};

export function PoolPassClaimModal({ isOpen, onClose, reward, rank, rewardType }: PoolPassClaimModalProps) {
  useEffect(() => {
    if (isOpen && reward) {
      void playRewardClaim();
    }
  }, [isOpen, reward]);

  if (!reward) return null;

  const config = typeConfig[rewardType];
  const rarity = reward.rarity ?? 'common';
  const rarityStyle = rarityConfig[rarity];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-sm bg-slate-900 rounded-3xl border-2 p-6 text-center',
              rarityStyle.border,
              'shadow-2xl',
              rarityStyle.glow
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Type badge */}
            <span className={cn('inline-block px-3 py-0.5 rounded-full text-xs font-bold text-white mb-3', config.badge)}>
              {config.label} — Rank {rank}
            </span>

            {/* Glow animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className={cn(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-r',
                config.color
              )}
            />

            {/* Reward icon */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                config.color
              )}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            {/* Reward name */}
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-black text-white mb-1"
            >
              {reward.name || reward.type}
            </motion.h3>

            {/* Amount */}
            {reward.amount > 0 && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-black text-amber-400 mb-2"
              >
                +{reward.amount.toLocaleString()}
              </motion.p>
            )}

            {/* Rarity */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={cn(
                'text-xs uppercase tracking-widest font-bold',
                rarity === 'legendary' && 'text-amber-400',
                rarity === 'epic' && 'text-purple-400',
                rarity === 'rare' && 'text-blue-400',
                rarity === 'common' && 'text-slate-400'
              )}
            >
              {rarity}
            </motion.p>

            {/* Confirm button */}
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={cn(
                'mt-5 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r',
                config.color,
                'shadow-lg'
              )}
            >
              Coletar!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
