'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer, Coins } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { EngineState } from '@/lib/engine/gameEngine';

interface GameHUDProps {
  timeLeft: number;
  engineState: EngineState;
}

export function GameHUD({ timeLeft, engineState }: GameHUDProps) {
  const t = useTranslations('game');
  const { potentialReward } = useGameStore();

  return (
    <div className="flex items-center justify-between w-full">
      {/* Player 1 (User) */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white/20">
          EU
        </div>
        <span className="text-white text-sm font-medium hidden sm:inline">
          {engineState.player1Type ? `${t('you') ?? 'Você'} (${engineState.player1Type === 'solid' ? '1-7' : '9-15'})` : (t('you') ?? 'Você')}
        </span>
      </div>

      {/* Center Info */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-slate-900/80 text-white border border-slate-700'
          )}
        >
          <Timer className="w-3.5 h-3.5" />
          <span className="text-sm">{timeLeft}s</span>
        </motion.div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">
            {potentialReward.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Player 2 (Opponent) */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium hidden sm:inline">
          {engineState.player2Type ? `Bot (${engineState.player2Type === 'solid' ? '1-7' : '9-15'})` : 'Bot'}
        </span>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white/20">
          BOT
        </div>
      </div>
    </div>
  );
}
