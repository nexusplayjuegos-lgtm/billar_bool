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

  const isPlayerTurn = engineState.currentPlayer === 1;

  return (
    <div className="flex items-center justify-between w-full gap-2">
      {/* Player 1 (User) */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] border-2 shrink-0',
            isPlayerTurn
              ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-white/40'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 border-white/10'
          )}
        >
          1
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-[10px] font-medium truncate leading-tight">
            {engineState.player1Type
              ? engineState.player1Type === 'solid'
                ? '1-7'
                : '9-15'
              : '—'}
          </span>
          {isPlayerTurn && (
            <span className="text-blue-400 text-[9px] leading-tight">{t('yourTurn')}</span>
          )}
        </div>
      </div>

      {/* Center Info */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-slate-900/80 text-white border border-slate-700'
          )}
        >
          <Timer className="w-3 h-3" />
          <span className="text-xs">{timeLeft}s</span>
        </motion.div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">
            {potentialReward > 0 ? potentialReward.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Player 2 (Bot) */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-white text-[10px] font-medium truncate leading-tight">
            {engineState.player2Type
              ? engineState.player2Type === 'solid'
                ? '1-7'
                : '9-15'
              : '—'}
          </span>
          {!isPlayerTurn && (
            <span className="text-red-400 text-[9px] leading-tight">{t('opponentTurn')}</span>
          )}
        </div>
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] border-2 shrink-0',
            !isPlayerTurn
              ? 'bg-gradient-to-br from-red-400 to-red-600 border-white/40'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 border-white/10'
          )}
        >
          2
        </div>
      </div>
    </div>
  );
}
