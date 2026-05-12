'use client';

import { motion } from 'framer-motion';
import { Check, Gift, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyMission, WeeklyChallenge } from '@/types';

interface MissionCardProps {
  mission: DailyMission | WeeklyChallenge;
  onClaim: () => void;
  index?: number;
}

export function MissionCard({ mission, onClaim, index = 0 }: MissionCardProps) {
  const isWeekly = 'difficulty' in mission;
  const progressPercent = Math.min(100, (mission.current / mission.target) * 100);
  const canClaim = mission.completed && !mission.claimed;

  const difficultyColor = isWeekly
    ? mission.difficulty === 'easy'
      ? 'text-green-400 border-green-400/30 bg-green-400/10'
      : mission.difficulty === 'medium'
        ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
        : 'text-red-400 border-red-400/30 bg-red-400/10'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'relative bg-slate-800/90 rounded-xl p-4 border transition-all',
        mission.claimed
          ? 'border-slate-700/50 opacity-60'
          : canClaim
            ? 'border-amber-400/50 shadow-lg shadow-amber-500/10'
            : 'border-slate-700/80'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center text-xl">
            {mission.icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{mission.title}</h3>
            <p className="text-slate-400 text-xs">{mission.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isWeekly && 'difficulty' in mission && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border', difficultyColor)}>
              {mission.difficulty}
            </span>
          )}
          {mission.claimed && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
              <Check className="w-3 h-3" /> Coletado
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">
            Progresso: <span className="text-white font-bold">{mission.current}</span>/{mission.target}
          </span>
          <span className="text-slate-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              mission.claimed
                ? 'bg-slate-600'
                : mission.completed
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Reward + Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">
            {mission.reward.amount} {mission.reward.type === 'coins' ? '🪙' : mission.reward.type === 'cash' ? '💎' : mission.reward.type === 'xp' ? '⭐' : '📦'}
          </span>
        </div>

        {canClaim ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-500/20"
          >
            Coletar
          </motion.button>
        ) : mission.claimed ? (
          <span className="px-3 py-1 text-[10px] text-slate-500 font-medium">
            Recompensa coletada
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Lock className="w-3 h-3" /> Em andamento
          </span>
        )}
      </div>
    </motion.div>
  );
}
