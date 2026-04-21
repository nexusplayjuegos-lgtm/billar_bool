'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Timer } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { EngineState } from '@/lib/engine/gameEngine';
import type { Tables } from '@/lib/supabase/client';

interface MultiplayerGameHUDProps {
  timeLeft: number;
  engineState: EngineState;
  myProfile: Tables['profiles'] | null;
  opponentProfile: Tables['profiles'] | null;
  isMyTurn: boolean;
  playerNumber: 1 | 2 | null;
}

function EightBallHUD({
  engineState,
  timeLeft,
  isMyTurn,
  potentialReward,
  myProfile,
  opponentProfile,
  playerNumber,
  t,
}: {
  engineState: EngineState;
  timeLeft: number;
  isMyTurn: boolean;
  potentialReward: number;
  myProfile: Tables['profiles'] | null;
  opponentProfile: Tables['profiles'] | null;
  playerNumber: 1 | 2 | null;
  t: (key: string) => string;
}) {
  const myType = playerNumber === 1 ? engineState.player1Type : engineState.player2Type;
  const oppType = playerNumber === 1 ? engineState.player2Type : engineState.player1Type;

  const myBalls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!myType) return false;
    if (myType === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const myPocketed = myBalls.filter((b) => b.inPocket).length;
  const myTotal = myBalls.length;

  const oppBalls = engineState.balls.filter((b) => {
    if (!b.number || b.number === 0 || b.number === 8) return false;
    if (!oppType) return false;
    if (oppType === 'solid') return b.number <= 7;
    return b.number >= 9;
  });
  const oppPocketed = oppBalls.filter((b) => b.inPocket).length;
  const oppTotal = oppBalls.length;

  return (
    <>
      {/* Player (Me) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0',
              isMyTurn
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-white/50 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {myProfile?.username?.charAt(0).toUpperCase() ?? 'EU'}
          </div>
          {isMyTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {myProfile?.username ?? t('you')}
          </span>
          <div className="flex items-center gap-0.5 mt-0.5">
            {myType ? (
              <span className={cn(
                'text-[9px] font-bold',
                myType === 'solid' ? 'text-yellow-400' : 'text-blue-400'
              )}>
                {myType === 'solid' ? 'LISAS' : 'LISTRADAS'} {myPocketed}/{myTotal}
              </span>
            ) : (
              <span className="text-slate-500 text-[9px]">—</span>
            )}
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

      {/* Opponent */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {opponentProfile?.username ?? 'ADV'}
          </span>
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            {oppType ? (
              <span className={cn(
                'text-[9px] font-bold',
                oppType === 'solid' ? 'text-yellow-400' : 'text-blue-400'
              )}>
                {oppPocketed}/{oppTotal} {oppType === 'solid' ? 'LISAS' : 'LISTRADAS'}
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
              !isMyTurn
                ? 'bg-gradient-to-br from-red-500 to-red-700 border-white/50 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {opponentProfile?.username?.charAt(0).toUpperCase() ?? '🤖'}
          </div>
          {!isMyTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
      </div>
    </>
  );
}

function BrazilianHUD({
  engineState,
  timeLeft,
  isMyTurn,
  potentialReward,
  myProfile,
  opponentProfile,
  playerNumber,
  t,
}: {
  engineState: EngineState;
  timeLeft: number;
  isMyTurn: boolean;
  potentialReward: number;
  myProfile: Tables['profiles'] | null;
  opponentProfile: Tables['profiles'] | null;
  playerNumber: 1 | 2 | null;
  t: (key: string) => string;
}) {
  const myPoints = playerNumber === 1 ? engineState.player1Points : engineState.player2Points;
  const oppPoints = playerNumber === 1 ? engineState.player2Points : engineState.player1Points;

  return (
    <>
      {/* Player (Me) */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0',
              isMyTurn
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-white/50 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {myProfile?.username?.charAt(0).toUpperCase() ?? 'EU'}
          </div>
          {isMyTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {myProfile?.username ?? t('you')}
          </span>
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-green-400 text-[9px] font-bold">
              {myPoints} / {engineState.maxPoints}
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

      {/* Opponent */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <div className="flex flex-col min-w-0 text-right">
          <span className="text-white text-[10px] font-bold truncate leading-tight">
            {opponentProfile?.username ?? 'ADV'}
          </span>
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <span className="text-red-400 text-[9px] font-bold">
              {oppPoints} / {engineState.maxPoints}
            </span>
          </div>
        </div>
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shrink-0',
              !isMyTurn
                ? 'bg-gradient-to-br from-red-500 to-red-700 border-white/50 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 border-white/20'
            )}
          >
            {opponentProfile?.username?.charAt(0).toUpperCase() ?? '🤖'}
          </div>
          {!isMyTurn && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
          )}
        </div>
      </div>
    </>
  );
}

export function MultiplayerGameHUD({
  timeLeft,
  engineState,
  myProfile,
  opponentProfile,
  isMyTurn,
  playerNumber,
}: MultiplayerGameHUDProps) {
  const t = useTranslations('game');
  const { potentialReward } = useGameStore();

  return (
    <div className="flex items-center justify-between w-full gap-1">
      {engineState.mode === 'brazilian' ? (
        <BrazilianHUD
          engineState={engineState}
          timeLeft={timeLeft}
          isMyTurn={isMyTurn}
          potentialReward={potentialReward}
          myProfile={myProfile}
          opponentProfile={opponentProfile}
          playerNumber={playerNumber}
          t={t}
        />
      ) : (
        <EightBallHUD
          engineState={engineState}
          timeLeft={timeLeft}
          isMyTurn={isMyTurn}
          potentialReward={potentialReward}
          myProfile={myProfile}
          opponentProfile={opponentProfile}
          playerNumber={playerNumber}
          t={t}
        />
      )}
    </div>
  );
}
