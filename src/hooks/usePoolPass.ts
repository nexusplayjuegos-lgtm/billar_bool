'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import type {
  SeasonPass,
  PlayerSeasonProgress,
  RankInfo,
  PassType,
  PoolPassState,
} from '@/types';
import {
  MAX_RANK,
  POINTS_PER_RANK,
  MATCH_PP_REWARDS,
  ELITE_MULTIPLIER,
  calculateRankFromPoints,
} from '@/types/poolPass';

const INITIAL_STATE: PoolPassState = {
  season: null,
  progress: null,
  isLoading: true,
  error: null,
};

function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    result[camelKey] = value;
  }
  return result as Record<string, unknown>;
}

function adaptSeason(raw: Record<string, unknown>): SeasonPass {
  const data = snakeToCamel(raw);
  return {
    id: String(data.id ?? ''),
    seasonNumber: Number(data.seasonNumber ?? 0),
    title: String(data.title ?? ''),
    startDate: String(data.startDate ?? ''),
    endDate: String(data.endDate ?? ''),
    theme: (data.theme as SeasonPass['theme']) || { primaryColor: '#3B82F6', secondaryColor: '#8B5CF6', accentColor: '#F59E0B' },
    freeRewards: (data.freeRewards as SeasonPass['freeRewards']) || [],
    premiumRewards: (data.premiumRewards as SeasonPass['premiumRewards']) || [],
    eliteRewards: (data.eliteRewards as SeasonPass['eliteRewards']) || [],
    createdAt: String(data.createdAt ?? ''),
  };
}

function adaptProgress(raw: Record<string, unknown>): PlayerSeasonProgress {
  const data = snakeToCamel(raw);
  return {
    id: String(data.id ?? ''),
    profileId: String(data.profileId ?? ''),
    seasonId: String(data.seasonId ?? ''),
    currentRank: Number(data.currentRank ?? 1),
    poolPoints: Number(data.poolPoints ?? 0),
    hasPremium: Boolean(data.hasPremium ?? false),
    hasElite: Boolean(data.hasElite ?? false),
    rewardsClaimed: (data.rewardsClaimed as number[]) || [],
    premiumClaimed: (data.premiumClaimed as number[]) || [],
    eliteClaimed: (data.eliteClaimed as number[]) || [],
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

export function usePoolPass() {
  const [state, setState] = useState<PoolPassState>(INITIAL_STATE);
  const { session, isSessionLoaded } = useUserStore();
  const userId = session?.user?.id ?? null;

  const fetchSeasonData = useCallback(async () => {
    if (!userId || !isSessionLoaded) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke<{ season: Record<string, unknown> | null; progress: Record<string, unknown> | null }>(
        'get-season',
        {}
      );

      if (error) {
        console.error('[usePoolPass] Erro ao buscar season:', error);
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      if (!data?.season) {
        setState({ season: null, progress: null, isLoading: false, error: null });
        return;
      }

      setState({
        season: adaptSeason(data.season),
        progress: data.progress ? adaptProgress(data.progress) : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [userId, isSessionLoaded]);

  useEffect(() => {
    void fetchSeasonData();
  }, [fetchSeasonData]);

  const claimReward = useCallback(
    async (rank: number, rewardType: 'free' | 'premium' | 'elite'): Promise<boolean> => {
      if (!state.season || !state.progress) return false;

      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean }>('claim-reward', {
          body: {
            season_id: state.season.id,
            rank,
            reward_type: rewardType,
          },
        });

        if (error || !data?.success) {
          console.error('[usePoolPass] Erro ao coletar recompensa:', error);
          return false;
        }

        // Atualizar estado local
        setState((prev) => {
          if (!prev.progress) return prev;
          const newProgress = { ...prev.progress };
          if (rewardType === 'free') {
            newProgress.rewardsClaimed = [...newProgress.rewardsClaimed, rank];
          } else if (rewardType === 'premium') {
            newProgress.premiumClaimed = [...newProgress.premiumClaimed, rank];
          } else {
            newProgress.eliteClaimed = [...newProgress.eliteClaimed, rank];
          }
          return { ...prev, progress: newProgress };
        });

        return true;
      } catch (err) {
        console.error('[usePoolPass] Erro ao coletar:', err);
        return false;
      }
    },
    [state.season, state.progress]
  );

  const buyPass = useCallback(
    async (passType: PassType): Promise<boolean> => {
      if (!state.season || !state.progress) return false;

      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean }>('buy-pass', {
          body: {
            season_id: state.season.id,
            pass_type: passType,
          },
        });

        if (error || !data?.success) {
          console.error('[usePoolPass] Erro ao comprar pass:', error);
          return false;
        }

        // Recarregar dados
        await fetchSeasonData();
        return true;
      } catch (err) {
        console.error('[usePoolPass] Erro na compra:', err);
        return false;
      }
    },
    [state.season, state.progress, fetchSeasonData]
  );

  const addPoolPoints = useCallback(
    async (mode: '1v1' | 'tournament' | '9ball' | '8ball' | 'brazilian', result: 'win' | 'loss') => {
      if (!state.season || !state.progress || !userId) return;

      const key = `${mode}_${result}` as keyof typeof MATCH_PP_REWARDS;
      let basePoints = MATCH_PP_REWARDS[key] ?? 0;

      if (state.progress.hasElite) {
        basePoints *= ELITE_MULTIPLIER;
      }

      const newPoints = state.progress.poolPoints + basePoints;
      const newRank = calculateRankFromPoints(newPoints);

      try {
        const { error } = await supabase
          .from('player_season_progress')
          .update({
            pool_points: newPoints,
            current_rank: newRank,
          })
          .eq('id', state.progress.id);

        if (error) {
          console.error('[usePoolPass] Erro ao adicionar PP:', error);
          return;
        }

        setState((prev) => {
          if (!prev.progress) return prev;
          return {
            ...prev,
            progress: {
              ...prev.progress,
              poolPoints: newPoints,
              currentRank: newRank,
            },
          };
        });
      } catch (err) {
        console.error('[usePoolPass] Erro ao salvar PP:', err);
      }
    },
    [state.season, state.progress, userId]
  );

  const getRankInfos = useCallback((): RankInfo[] => {
    if (!state.season || !state.progress) return [];

    const infos: RankInfo[] = [];
    for (let i = 1; i <= MAX_RANK; i++) {
      const pointsRequired = (i - 1) * POINTS_PER_RANK;
      infos.push({
        rank: i,
        pointsRequired,
        freeReward: state.season.freeRewards[i - 1] || null,
        premiumReward: state.season.premiumRewards[i - 1] || null,
        eliteReward: state.season.eliteRewards[i - 1] || null,
        isFreeClaimed: state.progress.rewardsClaimed.includes(i),
        isPremiumClaimed: state.progress.premiumClaimed.includes(i),
        isEliteClaimed: state.progress.eliteClaimed.includes(i),
        isUnlocked: state.progress.poolPoints >= pointsRequired,
      });
    }
    return infos;
  }, [state.season, state.progress]);

  const getCurrentRankInfo = useCallback(() => {
    const infos = getRankInfos();
    if (!state.progress || infos.length === 0) return null;
    const currentRankIndex = Math.min(state.progress.currentRank - 1, MAX_RANK - 1);
    return infos[currentRankIndex] || null;
  }, [getRankInfos, state.progress]);

  const getNextRankInfo = useCallback(() => {
    if (!state.progress || state.progress.currentRank >= MAX_RANK) return null;
    const infos = getRankInfos();
    return infos[state.progress.currentRank] || null;
  }, [getRankInfos, state.progress]);

  const getClaimableRewards = useCallback(() => {
    return getRankInfos().filter((rank) => {
      if (!rank.isUnlocked) return false;
      if (rank.freeReward && !rank.isFreeClaimed) return true;
      if (state.progress?.hasPremium && rank.premiumReward && !rank.isPremiumClaimed) return true;
      if (state.progress?.hasElite && rank.eliteReward && !rank.isEliteClaimed) return true;
      return false;
    });
  }, [getRankInfos, state.progress]);

  const getUnclaimedCount = useCallback(() => {
    return getClaimableRewards().length;
  }, [getClaimableRewards]);

  const pointsToNextRank = useCallback(() => {
    if (!state.progress || state.progress.currentRank >= MAX_RANK) return 0;
    const nextRankPoints = state.progress.currentRank * POINTS_PER_RANK;
    return Math.max(0, nextRankPoints - state.progress.poolPoints);
  }, [state.progress]);

  const seasonProgress = useCallback(() => {
    if (!state.progress) return 0;
    const maxPoints = MAX_RANK * POINTS_PER_RANK;
    return Math.min(100, Math.round((state.progress.poolPoints / maxPoints) * 100));
  }, [state.progress]);

  return {
    season: state.season,
    progress: state.progress,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchSeasonData,
    claimReward,
    buyPass,
    addPoolPoints,
    getRankInfos,
    getCurrentRankInfo,
    getNextRankInfo,
    getClaimableRewards,
    getUnclaimedCount,
    pointsToNextRank,
    seasonProgress,
  };
}
