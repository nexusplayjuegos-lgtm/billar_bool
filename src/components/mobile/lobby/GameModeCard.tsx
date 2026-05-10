'use client';

import { motion } from 'framer-motion';
import { Lock, Play, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GameMode } from '@/types';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store';

interface GameModeCardProps {
  mode: GameMode;
  index: number;
  isSelected?: boolean;
  onSelect: (mode: GameMode) => void;
}

export function GameModeCard({ mode, index, isSelected, onSelect }: GameModeCardProps) {
  const t = useTranslations('modes');
  const { profile } = useUserStore();

  const isLocked = profile.level < mode.minLevel;
  const canAfford = profile.currencies.coins >= mode.entryFee.coins;
  const onlinePlayers = `${(2.4 + index * 1.7).toFixed(1)}K`;

  const handleCardClick = () => {
    if (!isLocked) {
      onSelect(mode);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      onSelect(mode);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={cn(
        'relative flex-shrink-0 w-56 landscape:w-36 h-52 landscape:h-28 rounded-xl overflow-hidden cursor-pointer',
        'border transition-all duration-300 shadow-[0_18px_42px_rgba(2,6,23,0.36)]',
        isSelected && !isLocked ? 'ring-2 ring-cyan-300/70 border-cyan-200/60' : '',
        isLocked
          ? 'border-slate-700 opacity-60'
          : canAfford
          ? 'border-white/10 hover:border-white/35'
          : 'border-red-500/50 opacity-80'
      )}
      style={{
        background: `linear-gradient(135deg, ${mode.color}20 0%, ${mode.color}40 50%, ${mode.color}20 100%)`,
        boxShadow: mode.glow ? `0 0 30px ${mode.color}30` : 'none',
      }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${mode.color} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Featured Badge */}
      {mode.featured && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[10px] font-bold">
          DESTAQUE
        </div>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
          <Lock className="w-8 h-8 landscape:w-5 landscape:h-5 text-slate-400 mb-1" />
          <span className="text-slate-300 text-xs landscape:text-[10px] font-medium">
            Nível {mode.minLevel}
          </span>
          {mode.lockedMessageKey && (
            <span className="text-slate-400 text-[10px] mt-0.5">
              {t(mode.lockedMessageKey.replace('modes.', ''))}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col p-3 landscape:p-2">
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-950/45 px-2 py-0.5 text-[10px] font-semibold text-cyan-100 landscape:right-2 landscape:top-2 landscape:text-[8px]">
          <Users className="h-3 w-3 landscape:h-2.5 landscape:w-2.5" />
          {onlinePlayers}
        </div>

        {/* Icon */}
        <div
          className="w-12 h-12 landscape:w-8 landscape:h-8 rounded-xl flex items-center justify-center mb-2 landscape:mb-1"
          style={{ background: `linear-gradient(135deg, ${mode.color}60, ${mode.color})` }}
        >
          <span className="text-2xl landscape:text-lg">
            {mode.type === '8ball' && '🎱'}
            {mode.type === 'brazilian' && '🇧🇷'}
            {mode.type === 'snooker' && '👑'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-base landscape:text-xs font-black mb-0.5 landscape:mb-0">
          {t(`${mode.id.split('_')[1]}.name`)}
        </h3>
        <p className="text-white/70 text-xs landscape:text-[9px] mb-1 landscape:mb-0.5">
          {t(`${mode.id.split('_')[1]}.subtitle`)}
        </p>

        {/* Description - hidden in landscape */}
        <p className="text-white/50 text-[10px] leading-relaxed flex-1 line-clamp-2 hidden landscape:hidden">
          {t(`${mode.id.split('_')[1]}.desc`)}
        </p>

        {/* Entry Fee & Reward */}
        <div className="mt-2 landscape:mt-0.5 space-y-1 landscape:space-y-0.5 rounded-lg bg-slate-950/25 p-2 landscape:p-1">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-[10px] landscape:text-[8px]">Entrada:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className={cn(
                'text-xs landscape:text-[10px] font-bold',
                canAfford ? 'text-amber-400' : 'text-red-400'
              )}>
                {mode.entryFee.coins}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-[10px] landscape:text-[8px]">Prêmio:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400 text-xs landscape:text-[10px] font-bold">
                {mode.reward.win}
              </span>
            </div>
          </div>
        </div>

        {/* Play Button */}
        {!isLocked && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayClick}
            className={cn(
              'mt-2 landscape:mt-1 w-full py-2 landscape:py-1 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all text-sm landscape:text-[10px]',
              canAfford
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-blue-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            )}
            disabled={!canAfford}
          >
            <Play className="w-3.5 h-3.5 landscape:w-3 landscape:h-3" />
            {canAfford ? 'JOGAR' : 'SEM SALDO'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
