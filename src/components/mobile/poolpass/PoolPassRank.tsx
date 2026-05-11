'use client';

import { motion } from 'framer-motion';
import { Lock, Check, Gift, Star, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RankInfo } from '@/types';
import { MAX_RANK } from '@/types/poolPass';

interface PoolPassRankProps {
  rankInfo: RankInfo;
  isCurrentRank: boolean;
  onClaim: (rank: number, type: 'free' | 'premium' | 'elite') => void;
  onSelectReward: (reward: RankInfo, type: 'free' | 'premium' | 'elite') => void;
}

function RewardBadge({
  type,
  claimed,
  unlocked,
  hasAccess,
}: {
  type: 'free' | 'premium' | 'elite';
  claimed: boolean;
  unlocked: boolean;
  hasAccess: boolean;
}) {
  const configs = {
    free: { icon: Gift, color: 'from-slate-400 to-slate-500', border: 'border-slate-400/50', bg: 'bg-slate-800/80' },
    premium: { icon: Star, color: 'from-amber-400 to-amber-600', border: 'border-amber-400/50', bg: 'bg-amber-900/30' },
    elite: { icon: Zap, color: 'from-purple-400 to-purple-600', border: 'border-purple-400/50', bg: 'bg-purple-900/30' },
  };

  const config = configs[type];
  const Icon = config.icon;

  if (claimed) {
    return (
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border', config.bg, config.border)}>
        <Check className="w-4 h-4 text-green-400" />
      </div>
    );
  }

  if (!unlocked || !hasAccess) {
    return (
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border border-slate-600/50 bg-slate-900/50')}>
        <Lock className="w-3 h-3 text-slate-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center border bg-gradient-to-br',
        config.color,
        config.border
      )}
    >
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

function RewardItem({
  rankInfo,
  type,
  onClaim,
  onSelect,
}: {
  rankInfo: RankInfo;
  type: 'free' | 'premium' | 'elite';
  onClaim: (rank: number, type: 'free' | 'premium' | 'elite') => void;
  onSelect: (reward: RankInfo, type: 'free' | 'premium' | 'elite') => void;
}) {
  const reward = type === 'free' ? rankInfo.freeReward : type === 'premium' ? rankInfo.premiumReward : rankInfo.eliteReward;
  const claimed = type === 'free' ? rankInfo.isFreeClaimed : type === 'premium' ? rankInfo.isPremiumClaimed : rankInfo.isEliteClaimed;
  const hasAccess = type === 'free' ? true : type === 'premium' ? rankInfo.isUnlocked : rankInfo.isUnlocked;

  if (!reward) return null;

  const canClaim = rankInfo.isUnlocked && hasAccess && !claimed;

  return (
    <motion.button
      whileTap={canClaim ? { scale: 0.92 } : undefined}
      onClick={() => {
        if (canClaim) {
          onClaim(rankInfo.rank, type);
        } else if (rankInfo.isUnlocked) {
          onSelect(rankInfo, type);
        }
      }}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all',
        canClaim ? 'bg-white/10 active:bg-white/20' : 'opacity-60'
      )}
    >
      <RewardBadge type={type} claimed={claimed} unlocked={rankInfo.isUnlocked} hasAccess={hasAccess} />
      <div className="flex flex-col items-start min-w-0">
        <span className="text-[10px] text-slate-300 truncate max-w-[80px]">
          {reward.amount > 1 ? `${reward.amount} ` : ''}
          {reward.name || reward.type}
        </span>
        {reward.rarity && (
          <span
            className={cn(
              'text-[8px] uppercase tracking-wider',
              reward.rarity === 'legendary' && 'text-amber-400',
              reward.rarity === 'epic' && 'text-purple-400',
              reward.rarity === 'rare' && 'text-blue-400',
              reward.rarity === 'common' && 'text-slate-400'
            )}
          >
            {reward.rarity}
          </span>
        )}
      </div>
    </motion.button>
  );
}

export function PoolPassRank({ rankInfo, isCurrentRank, onClaim, onSelectReward }: PoolPassRankProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors',
        isCurrentRank
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40'
          : 'bg-slate-900/60 border-slate-700/40'
      )}
    >
      {/* Rank number */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm',
          isCurrentRank
            ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-lg shadow-blue-500/30'
            : rankInfo.isUnlocked
              ? 'bg-slate-700 text-slate-300'
              : 'bg-slate-800 text-slate-500'
        )}
      >
        {rankInfo.rank === MAX_RANK ? <Crown className="w-4 h-4" /> : rankInfo.rank}
      </div>

      {/* Progress bar for current rank */}
      {isCurrentRank && (
        <div className="absolute left-14 right-3 -top-1 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
            initial={{ width: 0 }}
            animate={{ width: `${rankInfo.progressPercent ?? 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Rewards */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <RewardItem rankInfo={rankInfo} type="free" onClaim={onClaim} onSelect={onSelectReward} />
        <RewardItem rankInfo={rankInfo} type="premium" onClaim={onClaim} onSelect={onSelectReward} />
        <RewardItem rankInfo={rankInfo} type="elite" onClaim={onClaim} onSelect={onSelectReward} />
      </div>
    </motion.div>
  );
}
