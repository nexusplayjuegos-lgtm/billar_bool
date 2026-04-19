'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { EngineState } from '@/lib/engine/gameEngine';

interface DesktopGameHUDProps {
  timeLeft: number;
  engineState: EngineState;
}

export function DesktopGameHUD({ timeLeft, engineState }: DesktopGameHUDProps) {
  const t = useTranslations('game');
  const { potentialReward } = useGameStore();
  const isPlayerTurn = engineState.currentPlayer === 1;

  const isBrazilian = engineState.mode === 'brazilian';

  // 8-ball: bolas do jogador
  const p1Balls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!engineState.player1Type) return false;
    if (engineState.player1Type === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const p1Pocketed = p1Balls.filter((b) => b.inPocket).length;
  const p1Total = p1Balls.length;

  const p2Balls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!engineState.player2Type) return false;
    if (engineState.player2Type === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const p2Pocketed = p2Balls.filter((b) => b.inPocket).length;
  const p2Total = p2Balls.length;

  return (
    <div className="flex items-center justify-between flex-1 px-6">
      {/* Player 1 (User) */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2',
              isPlayerTurn
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-white/50 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            EU
          </div>
          {isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">{t('you')}</span>
          {isBrazilian ? (
            <span className="text-green-400 text-xs font-bold">
              {engineState.player1Points} / {engineState.maxPoints}
            </span>
          ) : engineState.player1Type ? (
            <span className={cn(
              'text-xs font-bold',
              engineState.player1Type === 'solid' ? 'text-yellow-400' : 'text-blue-400'
            )}>
              {engineState.player1Type === 'solid' ? 'LISAS' : 'LISTRADAS'} {p1Pocketed}/{p1Total}
            </span>
          ) : (
            <span className="text-slate-500 text-xs">—</span>
          )}
        </div>
      </div>

      {/* Center Info */}
      <div className="flex flex-col items-center gap-1">
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-2 px-4 py-1 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/25 text-red-400 border border-red-500/50'
              : 'bg-slate-800/90 text-white border border-slate-600'
          )}
        >
          <Timer className="w-4 h-4" />
          <span className="text-sm tabular-nums">{timeLeft}s</span>
        </motion.div>
        {potentialReward > 0 && (
          <span className="text-amber-400 text-xs font-bold">
            🏆 {potentialReward.toLocaleString()}
          </span>
        )}
        {isBrazilian && (
          <span className="text-slate-400 text-[10px]">
            {t('targetPoints', { points: engineState.maxPoints })}
          </span>
        )}
      </div>

      {/* Player 2 (Bot) */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-white text-sm font-bold">BOT</span>
          {isBrazilian ? (
            <span className="text-red-400 text-xs font-bold">
              {engineState.player2Points} / {engineState.maxPoints}
            </span>
          ) : engineState.player2Type ? (
            <span className={cn(
              'text-xs font-bold',
              engineState.player2Type === 'solid' ? 'text-yellow-400' : 'text-blue-400'
            )}>
              {p2Pocketed}/{p2Total} {engineState.player2Type === 'solid' ? 'LISAS' : 'LISTRADAS'}
            </span>
          ) : (
            <span className="text-slate-500 text-xs">—</span>
          )}
        </div>
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2',
              !isPlayerTurn
                ? 'bg-gradient-to-br from-red-500 to-red-700 border-white/50 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            🤖
          </div>
          {!isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
          )}
        </div>
      </div>
    </div>
  );
}
