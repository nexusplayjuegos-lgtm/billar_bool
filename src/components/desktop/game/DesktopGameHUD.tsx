'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer, Coins, Trophy } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DesktopGameHUDProps {
  timeLeft: number;
  modeId?: string;
}

export function DesktopGameHUD({ timeLeft, modeId }: DesktopGameHUDProps) {
  const t = useTranslations('game');
  const { gameState, potentialReward } = useGameStore();

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Player 1 (User) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-4 border-blue-500/30 shadow-lg shadow-blue-500/20">
            EU
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-lg">{t('you')}</p>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm">{t('yourTurn')}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-sm">Nv. 12</span>
          </div>
        </div>
      </motion.div>

      {/* Center - Game Info */}
      <div className="flex flex-col items-center">
        {/* Timer */}
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-full font-bold text-lg mb-2',
            timeLeft <= 10
              ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
              : 'bg-slate-800 text-white border-2 border-slate-700'
          )}
        >
          <Timer className="w-5 h-5" />
          <span>{timeLeft}s</span>
        </motion.div>

        {/* Bet Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-bold">
              {potentialReward.toLocaleString()}
            </span>
          </div>

          {modeId && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Trophy className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">
                {modeId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Player 2 (Opponent) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <div className="text-right">
          <p className="text-white font-bold text-lg">Bot</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-slate-400 text-sm">Nv. 15</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-sm">{t('waiting')}</span>
          </div>
        </div>
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg border-4 border-red-500/30 shadow-lg shadow-red-500/20 opacity-60">
            BOT
          </div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
