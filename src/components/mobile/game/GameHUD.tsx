'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { EngineState } from '@/lib/engine/gameEngine';
import type { FakeOpponent } from '@/lib/store/gameStore';

interface GameHUDProps {
  timeLeft: number;
  engineState: EngineState;
  opponent?: FakeOpponent | null;
}

function HudPocketBall({ color, number, striped }: { color: string; number: number; striped?: boolean }) {
  return (
    <span
      className="relative grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-white/35 shadow-sm shadow-black/50"
      style={{
        background: striped
          ? `linear-gradient(180deg, #f8fafc 0 30%, ${color} 30% 70%, #f8fafc 70% 100%)`
          : number === 8
            ? '#111827'
            : color,
      }}
    >
      <span className="grid h-1.5 min-w-1.5 place-items-center rounded-full bg-white px-px text-[3.5px] font-black leading-none text-slate-950">
        {number}
      </span>
    </span>
  );
}

function HudPocketedBalls({ balls, align = 'left' }: { balls: EngineState['balls']; align?: 'left' | 'right' }) {
  if (balls.length === 0) return null;

  return (
    <div className={cn('flex max-w-[96px] flex-wrap gap-0.5', align === 'right' ? 'justify-end' : 'justify-start')}>
      {balls.map((ball) => (
        <HudPocketBall
          key={ball.id}
          color={ball.color}
          number={ball.number ?? ball.id}
          striped={ball.isStriped}
        />
      ))}
    </div>
  );
}

function EightBallHUD({ engineState, timeLeft, isPlayerTurn, potentialReward, t, opponent }: {
  engineState: EngineState;
  timeLeft: number;
  isPlayerTurn: boolean;
  potentialReward: number;
  t: (key: string) => string;
  opponent?: FakeOpponent | null;
}) {
  const p1Balls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!engineState.player1Type) return false;
    if (engineState.player1Type === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const p1Pocketed = p1Balls.filter((b) => b.inPocket).length;
  const p1PocketedBalls = p1Balls.filter((b) => b.inPocket);
  const p1Total = p1Balls.length;

  const p2Balls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!engineState.player2Type) return false;
    if (engineState.player2Type === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const p2Pocketed = p2Balls.filter((b) => b.inPocket).length;
  const p2PocketedBalls = p2Balls.filter((b) => b.inPocket);
  const p2Total = p2Balls.length;

  return (
    <>
      {/* Player 1 (User) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0 bg-gradient-to-br',
              opponent?.avatarGradient,
              isPlayerTurn
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-white/50 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            EU
          </div>
          {isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {t('you')}
          </span>
          <div className="flex items-center gap-0.5 mt-0.5">
            {engineState.player1Type ? (
              <span className={cn(
                'text-[9px] font-bold',
                engineState.player1Type === 'solid' ? 'text-yellow-400' : 'text-blue-400'
              )}>
                {engineState.player1Type === 'solid' ? 'LISAS' : 'LISTRADAS'} {p1Pocketed}/{p1Total}
              </span>
            ) : (
              <span className="text-slate-500 text-[9px]">—</span>
            )}
          </div>
        </div>
        <HudPocketedBalls balls={p1PocketedBalls} />
      </div>

      {/* Center Info */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/25 text-red-400 border border-red-500/50'
              : 'bg-slate-800/90 text-white border border-slate-600'
          )}
        >
          <Timer className="w-3 h-3" />
          <span className="text-xs tabular-nums">{timeLeft}s</span>
        </motion.div>
        {potentialReward > 0 && (
          <span className="text-amber-400 text-[10px] font-bold">
            🏆 {potentialReward.toLocaleString()}
          </span>
        )}
      </div>

      {/* Player 2 (Bot) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <HudPocketedBalls balls={p2PocketedBalls} align="right" />
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {opponent?.name ?? 'Rival'}
          </span>
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            {engineState.player2Type ? (
              <span className={cn(
                'text-[9px] font-bold',
                engineState.player2Type === 'solid' ? 'text-yellow-400' : 'text-blue-400'
              )}>
                {p2Pocketed}/{p2Total} {engineState.player2Type === 'solid' ? 'LISAS' : 'LISTRADAS'}
              </span>
            ) : (
              <span className="text-slate-500 text-[9px]">—</span>
            )}
          </div>
        </div>
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0',
              !isPlayerTurn
                ? 'bg-gradient-to-br from-red-500 to-red-700 border-white/50 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {opponent?.initials ?? 'RV'}
          </div>
          {!isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
      </div>
    </>
  );
}

function BrazilianHUD({ engineState, timeLeft, isPlayerTurn, potentialReward, t, opponent }: {
  engineState: EngineState;
  timeLeft: number;
  isPlayerTurn: boolean;
  potentialReward: number;
  t: (key: string) => string;
  opponent?: FakeOpponent | null;
}) {
  return (
    <>
      {/* Player 1 (User) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0 bg-gradient-to-br',
              opponent?.avatarGradient,
              isPlayerTurn
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-white/50 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            EU
          </div>
          {isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {t('you')}
          </span>
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-green-400 text-[9px] font-bold">
              {engineState.player1Points} / {engineState.maxPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Center Info */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <motion.div
          animate={timeLeft <= 10 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold',
            timeLeft <= 10
              ? 'bg-red-500/25 text-red-400 border border-red-500/50'
              : 'bg-slate-800/90 text-white border border-slate-600'
          )}
        >
          <Timer className="w-3 h-3" />
          <span className="text-xs tabular-nums">{timeLeft}s</span>
        </motion.div>
        {potentialReward > 0 && (
          <span className="text-amber-400 text-[10px] font-bold">
            🏆 {potentialReward.toLocaleString()}
          </span>
        )}
      </div>

      {/* Player 2 (Bot) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {opponent?.name ?? 'Rival'}
          </span>
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <span className="text-red-400 text-[9px] font-bold">
              {engineState.player2Points} / {engineState.maxPoints}
            </span>
          </div>
        </div>
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0',
              !isPlayerTurn
                ? 'bg-gradient-to-br from-red-500 to-red-700 border-white/50 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {opponent?.initials ?? 'RV'}
          </div>
          {!isPlayerTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
      </div>
    </>
  );
}

export function GameHUD({ timeLeft, engineState, opponent }: GameHUDProps) {
  const t = useTranslations('game');
  const { potentialReward } = useGameStore();
  const isPlayerTurn = engineState.currentPlayer === 1;

  return (
    <div className="flex items-center justify-between w-full gap-1">
      {engineState.mode === 'brazilian' ? (
        <BrazilianHUD
          engineState={engineState}
          timeLeft={timeLeft}
          isPlayerTurn={isPlayerTurn}
          potentialReward={potentialReward}
          t={t}
          opponent={opponent}
        />
      ) : (
        <EightBallHUD
          engineState={engineState}
          timeLeft={timeLeft}
          isPlayerTurn={isPlayerTurn}
          potentialReward={potentialReward}
          t={t}
          opponent={opponent}
        />
      )}
    </div>
  );
}
