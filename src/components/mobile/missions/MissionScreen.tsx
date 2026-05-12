'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Trophy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks';
import { useMissions } from '@/hooks/useMissions';
import { useUserStore } from '@/lib/store/userStore';
import { cn } from '@/lib/utils';
import { MissionCard } from './MissionCard';
import { playRewardClaim } from '@/lib/audio/gameAudio';

const tabs = [
  { id: 'daily', label: 'Diárias', icon: Calendar },
  { id: 'weekly', label: 'Semanais', icon: Trophy },
];

export function MissionScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { profile } = useUserStore();
  const { daily, weekly, isLoading, claimReward, getCompletedCount } = useMissions();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (scope: 'daily' | 'weekly', missionId: string) => {
    setClaimingId(missionId);
    const reward = await claimReward(scope, missionId);
    if (reward) {
      void playRewardClaim();
    }
    setClaimingId(null);
  };

  const completedCount = getCompletedCount();

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-lg font-black text-white">Missões</h1>
          {completedCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">{completedCount}</span>
            </div>
          )}
        </div>

        {/* Streak badge */}
        {daily && daily.streakDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-2"
          >
            <span className="text-lg">🔥</span>
            <p className="text-xs text-orange-300 font-medium">
              Sequência de {daily.streakDays} dia{daily.streakDays > 1 ? 's' : ''} completando todas as missões!
            </p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'daily' | 'weekly')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {!daily || daily.missions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhuma missão diária disponível.</p>
                </div>
              ) : (
                <>
                  {daily.allCompleted && !daily.allClaimed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-center"
                    >
                      <p className="text-amber-300 text-sm font-bold">🎉 Todas as missões diárias completadas!</p>
                      <p className="text-amber-400/70 text-xs">Colete todas as recompensas para manter a sequência.</p>
                    </motion.div>
                  )}
                  {daily.missions.map((mission, i) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      index={i}
                      onClaim={() => handleClaim('daily', mission.id)}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'weekly' && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {!weekly || weekly.challenges.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhum desafio semanal disponível.</p>
                </div>
              ) : (
                <>
                  {weekly.allCompleted && !weekly.allClaimed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center"
                    >
                      <p className="text-purple-300 text-sm font-bold">🏆 Todos os desafios semanais completados!</p>
                      <p className="text-purple-400/70 text-xs">Grande conquista! Colete suas recompensas.</p>
                    </motion.div>
                  )}
                  {weekly.challenges.map((challenge, i) => (
                    <MissionCard
                      key={challenge.id}
                      mission={challenge}
                      index={i}
                      onClaim={() => handleClaim('weekly', challenge.id)}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
