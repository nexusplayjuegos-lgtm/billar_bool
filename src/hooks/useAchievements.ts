'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import type {
  AchievementCategory,
  AchievementProgress,
  AchievementTier,
  AchievementUpdateResult,
} from '@/types';

interface AchievementsState {
  achievements: AchievementProgress[];
  isLoading: boolean;
  error: string | null;
}

function adaptAchievement(raw: Record<string, unknown>): AchievementProgress {
  const progress = (raw.progress ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    category: (raw.category as AchievementCategory) ?? 'wins',
    tier: (Number(raw.tier ?? 1) as AchievementTier),
    targetValue: Number(raw.target_value ?? 1),
    rewardCoins: Number(raw.reward_coins ?? 0),
    rewardCash: Number(raw.reward_cash ?? 0),
    rewardXp: Number(raw.reward_xp ?? 0),
    iconUrl: typeof raw.icon_url === 'string' ? raw.icon_url : null,
    createdAt: String(raw.created_at ?? ''),
    progress: {
      id: String(progress.id ?? ''),
      profileId: String(progress.profile_id ?? ''),
      achievementId: String(progress.achievement_id ?? ''),
      currentValue: Number(progress.current_value ?? 0),
      completed: Boolean(progress.completed ?? false),
      completedAt: typeof progress.completed_at === 'string' ? progress.completed_at : null,
      claimed: Boolean(progress.claimed ?? false),
      claimedAt: typeof progress.claimed_at === 'string' ? progress.claimed_at : null,
      createdAt: String(progress.created_at ?? ''),
      updatedAt: String(progress.updated_at ?? ''),
    },
  };
}

export function useAchievements() {
  const [state, setState] = useState<AchievementsState>({
    achievements: [],
    isLoading: true,
    error: null,
  });
  const { session, isSessionLoaded } = useUserStore();
  const userId = session?.user?.id ?? null;

  const fetchAchievements = useCallback(async () => {
    if (!userId || !isSessionLoaded) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke<{ achievements?: Record<string, unknown>[] }>(
        'get-achievements',
        {}
      );

      if (error) {
        console.error('[useAchievements] Erro ao buscar conquistas:', error);
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      setState({
        achievements: (data?.achievements ?? []).map(adaptAchievement),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [userId, isSessionLoaded]);

  useEffect(() => {
    void fetchAchievements();
  }, [fetchAchievements]);

  const updateAchievement = useCallback(
    async (
      achievementCode: string,
      options: { increment?: number; value?: number; mode?: 'increment' | 'max' } = {}
    ): Promise<AchievementUpdateResult | null> => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase.functions.invoke<{
          success?: boolean;
          updated?: boolean;
          completed?: boolean;
          achievement?: Record<string, unknown> | null;
        }>('update-achievements', {
          body: {
            action: 'progress',
            profile_id: userId,
            achievement_code: achievementCode,
            increment: options.increment ?? 1,
            value: options.value,
            mode: options.mode ?? 'increment',
          },
        });

        if (error || !data?.success) {
          console.error('[useAchievements] Erro ao atualizar conquista:', error);
          return null;
        }

        const achievement = data.achievement ? adaptAchievement(data.achievement) : null;

        if (achievement) {
          setState((prev) => {
            const exists = prev.achievements.some((item) => item.id === achievement.id);
            return {
              ...prev,
              achievements: exists
                ? prev.achievements.map((item) => (item.id === achievement.id ? achievement : item))
                : [...prev.achievements, achievement],
            };
          });
        }

        return {
          updated: Boolean(data.updated),
          completed: Boolean(data.completed),
          achievement,
        };
      } catch (err) {
        console.error('[useAchievements] Erro:', err);
        return null;
      }
    },
    [userId]
  );

  const claimAchievement = useCallback(
    async (achievementCode: string) => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase.functions.invoke<{
          success?: boolean;
          reward?: { coins: number; cash: number; xp: number };
          achievement?: Record<string, unknown> | null;
        }>('update-achievements', {
          body: {
            action: 'claim',
            profile_id: userId,
            achievement_code: achievementCode,
          },
        });

        if (error || !data?.success) {
          console.error('[useAchievements] Erro ao coletar conquista:', error);
          return null;
        }

        const achievement = data.achievement ? adaptAchievement(data.achievement) : null;
        if (achievement) {
          setState((prev) => ({
            ...prev,
            achievements: prev.achievements.map((item) => (item.id === achievement.id ? achievement : item)),
          }));
        }

        return data.reward ?? null;
      } catch (err) {
        console.error('[useAchievements] Erro:', err);
        return null;
      }
    },
    [userId]
  );

  const getClaimableCount = useCallback(() => {
    return state.achievements.filter((item) => item.progress.completed && !item.progress.claimed).length;
  }, [state.achievements]);

  return {
    achievements: state.achievements,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchAchievements,
    updateAchievement,
    claimAchievement,
    getClaimableCount,
  };
}
