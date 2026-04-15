'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer, Coins } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface GameHUDProps {
  timeLeft: number;
}

export function GameHUD({ timeLeft }: GameHUDProps) {
  const t = useTranslations('game');
  const { gameState, potentialReward } = useGameStore();

  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
      {/* Player 1 (User) */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
          EU
        </div>
        <div className="bg-slate-900/80 rounded-lg px-3 py-1.5 border border-slate-700">
          <span className="text-white text-sm font-medium">Você</span>
        </div>
      </div>

      {/* Center Info */}
      <div className="flex flex-col items-center gap-1">
        {/* Timer */}
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-slate-900/80 text-white border border-slate-700'
          )}
        >
          <Timer className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </motion.div>

        {/* Bet */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">
            {potentialReward.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Player 2 (Opponent) */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-900/80 rounded-lg px-3 py-1.5 border border-slate-700">
          <span className="text-white text-sm font-medium">Bot</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
          BOT
        </div>
      </div>
    </div>
  );
}
