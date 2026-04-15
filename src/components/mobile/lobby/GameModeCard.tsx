'use client';

import { motion } from 'framer-motion';
import { Lock, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GameMode } from '@/types';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store';

interface GameModeCardProps {
  mode: GameMode;
  index: number;
  onSelect: (mode: GameMode) => void;
}

export function GameModeCard({ mode, index, onSelect }: GameModeCardProps) {
  const t = useTranslations('modes');
  const { user } = useUserStore();

  const isLocked = user.level < mode.minLevel;
  const canAfford = user.currencies.coins >= mode.entryFee.coins;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !isLocked && onSelect(mode)}
      className={cn(
        'relative flex-shrink-0 w-64 h-80 rounded-2xl overflow-hidden cursor-pointer',
        'border-2 transition-all duration-300',
        isLocked
          ? 'border-slate-600 opacity-60'
          : canAfford
          ? 'border-transparent hover:border-white/30'
          : 'border-red-500/50 opacity-80'
      )}
      style={{
        background: `linear-gradient(135deg, ${mode.color}20 0%, ${mode.color}40 50%, ${mode.color}20 100%)`,
        boxShadow: mode.glow ? `0 0 40px ${mode.color}40` : 'none',
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${mode.color} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Featured Badge */}
      {mode.featured && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold">
          DESTAQUE
        </div>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center z-10">
          <Lock className="w-12 h-12 text-slate-400 mb-2" />
          <span className="text-slate-300 text-sm font-medium">
            Nível {mode.minLevel}
          </span>
          {mode.lockedMessageKey && (
            <span className="text-slate-400 text-xs mt-1">
              {t(mode.lockedMessageKey)}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col p-5">
        {/* Icon */}
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `linear-gradient(135deg, ${mode.color}60, ${mode.color})` }}
        >
          <span className="text-3xl">
            {mode.type === '8ball' && '🎱'}
            {mode.type === 'brazilian' && '🇧🇷'}
            {mode.type === 'snooker' && '👑'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-xl font-bold mb-1">
          {t(`${mode.id.split('_')[1]}.name`)}
        </h3>
        <p className="text-white/70 text-sm mb-3">
          {t(`${mode.id.split('_')[1]}.subtitle`)}
        </p>

        {/* Description */}
        <p className="text-white/50 text-xs leading-relaxed flex-1">
          {t(`${mode.id.split('_')[1]}.desc`)}
        </p>

        {/* Entry Fee & Reward */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">Entrada:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className={cn(
                'text-sm font-bold',
                canAfford ? 'text-amber-400' : 'text-red-400'
              )}>
                {mode.entryFee.coins}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">Prêmio:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-green-400 text-sm font-bold">
                {mode.reward.win}
              </span>
            </div>
          </div>
        </div>

        {/* Play Button */}
        {!isLocked && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all',
              canAfford
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            )}
            disabled={!canAfford}
          >
            <Play className="w-4 h-4" />
            {canAfford ? 'JOGAR' : 'SEM SALDO'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
