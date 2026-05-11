'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, ChevronUp, Trophy, Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks';
import { usePoolPass } from '@/hooks/usePoolPass';
import { playRewardClaim, playRankUp } from '@/lib/audio/gameAudio';
import { cn } from '@/lib/utils';
import { MAX_RANK, POINTS_PER_RANK } from '@/types/poolPass';
import type { RankInfo } from '@/types';
import { PoolPassRank } from './PoolPassRank';
import { PoolPassClaimModal } from './PoolPassClaimModal';
import { PoolPassPurchaseModal } from './PoolPassPurchaseModal';

export function PoolPassScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const {
    season,
    progress,
    isLoading,
    claimReward,
    buyPass,
    getRankInfos,
    getUnclaimedCount,
    pointsToNextRank,
    seasonProgress,
  } = usePoolPass();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [claimModal, setClaimModal] = useState<{
    isOpen: boolean;
    reward: RankInfo | null;
    type: 'free' | 'premium' | 'elite';
  }>({ isOpen: false, reward: null, type: 'free' });

  const scrollRef = useRef<HTMLDivElement>(null);
  const rankListRef = useRef<HTMLDivElement>(null);

  const rankInfos = useMemo(() => getRankInfos(), [getRankInfos]);
  const unclaimedCount = useMemo(() => getUnclaimedCount(), [getUnclaimedCount]);
  const nextPoints = useMemo(() => pointsToNextRank(), [pointsToNextRank]);
  const overallProgress = useMemo(() => seasonProgress(), [seasonProgress]);

  // Scroll para o rank atual ao carregar
  useEffect(() => {
    if (!isLoading && progress && rankListRef.current) {
      const currentIndex = Math.min(progress.currentRank - 1, MAX_RANK - 1);
      const element = rankListRef.current.children[currentIndex] as HTMLElement | undefined;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isLoading, progress]);

  const handleClaim = useCallback(
    async (rank: number, type: 'free' | 'premium' | 'elite') => {
      const success = await claimReward(rank, type);
      if (success) {
        void playRewardClaim();
      }
    },
    [claimReward]
  );

  const handleSelectReward = useCallback(
    (reward: RankInfo, type: 'free' | 'premium' | 'elite') => {
      const actualReward = type === 'free' ? reward.freeReward : type === 'premium' ? reward.premiumReward : reward.eliteReward;
      if (actualReward) {
        setClaimModal({ isOpen: true, reward, type });
      }
    },
    []
  );

  const handlePurchase = useCallback(
    async (type: 'premium' | 'elite') => {
      const success = await buyPass(type);
      if (success) {
        setShowPurchaseModal(false);
      }
    },
    [buyPass]
  );

  const handleClaimAll = useCallback(async () => {
    const claimable = rankInfos.filter((r) => {
      if (!r.isUnlocked) return false;
      if (r.freeReward && !r.isFreeClaimed) return true;
      if (progress?.hasPremium && r.premiumReward && !r.isPremiumClaimed) return true;
      if (progress?.hasElite && r.eliteReward && !r.isEliteClaimed) return true;
      return false;
    });

    for (const rank of claimable) {
      if (rank.freeReward && !rank.isFreeClaimed) {
        await handleClaim(rank.rank, 'free');
      }
      if (progress?.hasPremium && rank.premiumReward && !rank.isPremiumClaimed) {
        await handleClaim(rank.rank, 'premium');
      }
      if (progress?.hasElite && rank.eliteReward && !rank.isEliteClaimed) {
        await handleClaim(rank.rank, 'elite');
      }
    }
    void playRankUp();
  }, [rankInfos, progress, handleClaim]);

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

  if (!season) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 gap-4 px-6">
        <Trophy className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400 text-center">Nenhuma temporada ativa no momento.</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
        >
          Voltar ao Lobby
        </button>
      </div>
    );
  }

  const theme = season.theme;
  const currentRank = progress?.currentRank ?? 1;
  const currentPoints = progress?.poolPoints ?? 0;

  return (
    <div
      className="h-dvh flex flex-col bg-slate-950 overflow-hidden"
      style={{
        background: theme.backgroundImage
          ? `linear-gradient(to bottom, rgba(2,6,23,0.95), rgba(2,6,23,0.98)), url(${theme.backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-lg font-black text-white">{season.title}</h1>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r',
              progress?.hasElite
                ? 'from-purple-500 to-purple-600'
                : progress?.hasPremium
                  ? 'from-amber-500 to-amber-600'
                  : 'from-slate-500 to-slate-600'
            )}
          >
            {progress?.hasElite ? 'Elite' : progress?.hasPremium ? 'Premium' : 'Grátis'}
          </button>
        </div>

        {/* Progress overview */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                {currentRank}
              </div>
              <div>
                <p className="text-white text-sm font-bold">Rank {currentRank}</p>
                <p className="text-slate-400 text-xs">
                  {currentPoints.toLocaleString()} / {MAX_RANK * POINTS_PER_RANK} PP
                </p>
              </div>
            </div>
            {unclaimedCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClaimAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold"
              >
                <Gift className="w-3.5 h-3.5" />
                Coletar {unclaimedCount}
              </motion.button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          {nextPoints > 0 && (
            <p className="text-[10px] text-slate-500 mt-1.5 text-right">
              {nextPoints} PP para o próximo rank
            </p>
          )}
        </div>
      </div>

      {/* Rank list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        <div ref={rankListRef}>
          {rankInfos.map((rankInfo) => (
            <PoolPassRank
              key={rankInfo.rank}
              rankInfo={rankInfo}
              isCurrentRank={rankInfo.rank === currentRank}
              onClaim={handleClaim}
              onSelectReward={handleSelectReward}
            />
          ))}
        </div>

        {/* End of season */}
        <div className="text-center py-4">
          <Lock className="w-5 h-5 text-slate-600 mx-auto mb-1" />
          <p className="text-xs text-slate-500">Fim da temporada — {season.title}</p>
        </div>
      </div>

      {/* Upgrade banner (se não tiver premium/elite) */}
      {!progress?.hasPremium && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="shrink-0 px-4 py-3 bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-t border-amber-500/30"
        >
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Desbloquear Premium Pass
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <PoolPassPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
        hasPremium={progress?.hasPremium ?? false}
        hasElite={progress?.hasElite ?? false}
      />

      <PoolPassClaimModal
        isOpen={claimModal.isOpen}
        onClose={() => setClaimModal((prev) => ({ ...prev, isOpen: false }))}
        reward={
          claimModal.type === 'free'
            ? claimModal.reward?.freeReward ?? null
            : claimModal.type === 'premium'
              ? claimModal.reward?.premiumReward ?? null
              : claimModal.reward?.eliteReward ?? null
        }
        rank={claimModal.reward?.rank ?? 0}
        rewardType={claimModal.type}
      />
    </div>
  );
}
