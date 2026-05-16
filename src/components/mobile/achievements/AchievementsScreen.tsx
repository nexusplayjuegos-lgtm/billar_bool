'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, Check, Coins, Gem, Lock, Medal, Sparkles, Star, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';
import { playRewardClaim } from '@/lib/audio/gameAudio';
import type { AchievementCategory, AchievementProgress, AchievementTier } from '@/types';

const tabs: Array<{ id: AchievementCategory; label: string; icon: typeof Trophy }> = [
  { id: 'wins', label: 'Vitorias', icon: Trophy },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'collection', label: 'Colecao', icon: Award },
  { id: 'social', label: 'Social', icon: Users },
];

const tierMeta: Record<AchievementTier, { label: string; className: string }> = {
  1: { label: 'Bronze', className: 'text-orange-300 border-orange-400/30 bg-orange-400/10' },
  2: { label: 'Prata', className: 'text-slate-200 border-slate-300/30 bg-slate-300/10' },
  3: { label: 'Ouro', className: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  4: { label: 'Platina', className: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10' },
};

function AchievementCard({
  achievement,
  index,
  onClaim,
}: {
  achievement: AchievementProgress;
  index: number;
  onClaim: () => void;
}) {
  const progressPercent = Math.min(100, (achievement.progress.currentValue / achievement.targetValue) * 100);
  const canClaim = achievement.progress.completed && !achievement.progress.claimed;
  const tier = tierMeta[achievement.tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative rounded-xl border bg-slate-800/90 p-4 transition-all',
        achievement.progress.claimed
          ? 'border-slate-700/50 opacity-60'
          : canClaim
            ? 'border-amber-400/60 shadow-lg shadow-amber-500/10'
            : achievement.progress.completed
              ? 'border-emerald-400/50'
              : 'border-slate-700/80'
      )}
    >
      {canClaim && (
        <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
          Novo
        </div>
      )}

      <div className="mb-3 flex items-start gap-3 pr-12">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-700/80">
          <Medal className={cn('h-6 w-6', achievement.progress.completed ? 'text-amber-300' : 'text-slate-400')} />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{achievement.title}</h3>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', tier.className)}>
              {tier.label}
            </span>
          </div>
          <p className="text-xs text-slate-400">{achievement.description}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-400">
            Progresso:{' '}
            <span className="font-bold text-white">
              {achievement.progress.currentValue}/{achievement.targetValue}
            </span>
          </span>
          <span className="text-slate-400">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <motion.div
            className={cn(
              'h-full rounded-full',
              achievement.progress.claimed
                ? 'bg-slate-600'
                : achievement.progress.completed
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {achievement.rewardCoins > 0 && (
            <span className="flex items-center gap-1 text-amber-300">
              <Coins className="h-3.5 w-3.5" /> {achievement.rewardCoins}
            </span>
          )}
          {achievement.rewardCash > 0 && (
            <span className="flex items-center gap-1 text-cyan-300">
              <Gem className="h-3.5 w-3.5" /> {achievement.rewardCash}
            </span>
          )}
          {achievement.rewardXp > 0 && (
            <span className="flex items-center gap-1 text-violet-300">
              <Star className="h-3.5 w-3.5" /> {achievement.rewardXp}
            </span>
          )}
        </div>

        {canClaim ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-amber-500/20"
          >
            Coletar
          </motion.button>
        ) : achievement.progress.claimed ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-green-400">
            <Check className="h-3 w-3" /> Coletada
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Lock className="h-3 w-3" /> Bloqueada
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function AchievementsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { achievements, isLoading, claimAchievement, getClaimableCount } = useAchievements();
  const [activeTab, setActiveTab] = useState<AchievementCategory>('wins');

  const filteredAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.category === activeTab),
    [achievements, activeTab]
  );

  const completedCount = achievements.filter((achievement) => achievement.progress.completed).length;
  const claimableCount = getClaimableCount();

  const handleClaim = async (code: string) => {
    const reward = await claimAchievement(code);
    if (reward) {
      void playRewardClaim();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-4 border-amber-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="rounded-xl bg-slate-800/80 p-2 transition-colors hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-white">Conquistas</h1>
            <p className="text-[11px] text-slate-400">
              {completedCount}/{achievements.length} completas
            </p>
          </div>
          {claimableCount > 0 ? (
            <div className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-1">
              <Award className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-bold text-amber-200">{claimableCount}</span>
            </div>
          ) : (
            <div className="h-8 w-10" />
          )}
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold transition-all',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden min-[420px]:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="space-y-3 pb-4"
          >
            {filteredAchievements.length === 0 ? (
              <div className="py-10 text-center">
                <Award className="mx-auto mb-3 h-12 w-12 text-slate-700" />
                <p className="text-sm text-slate-500">Nenhuma conquista nesta categoria.</p>
              </div>
            ) : (
              filteredAchievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                  onClaim={() => void handleClaim(achievement.code)}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
