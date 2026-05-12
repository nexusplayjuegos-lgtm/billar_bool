'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import type { DailyMission, WeeklyChallenge, DailyMissionsRow, WeeklyChallengesRow } from '@/types';

interface MissionsState {
  daily: DailyMissionsRow | null;
  weekly: WeeklyChallengesRow | null;
  isLoading: boolean;
  error: string | null;
}

function adaptDaily(raw: Record<string, unknown>): DailyMissionsRow {
  return {
    id: String(raw.id ?? ''),
    profileId: String(raw.profile_id ?? ''),
    date: String(raw.date ?? ''),
    missions: (raw.missions as DailyMission[]) || [],
    allCompleted: Boolean(raw.all_completed ?? false),
    allClaimed: Boolean(raw.all_claimed ?? false),
    streakDays: Number(raw.streak_days ?? 0),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
  };
}

function adaptWeekly(raw: Record<string, unknown>): WeeklyChallengesRow {
  return {
    id: String(raw.id ?? ''),
    profileId: String(raw.profile_id ?? ''),
    weekStart: String(raw.week_start ?? ''),
    challenges: (raw.challenges as WeeklyChallenge[]) || [],
    allCompleted: Boolean(raw.all_completed ?? false),
    allClaimed: Boolean(raw.all_claimed ?? false),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
  };
}

export function useMissions() {
  const [state, setState] = useState<MissionsState>({
    daily: null,
    weekly: null,
    isLoading: true,
    error: null,
  });
  const { session, isSessionLoaded } = useUserStore();
  const userId = session?.user?.id ?? null;

  const fetchMissions = useCallback(async () => {
    if (!userId || !isSessionLoaded) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke<{
        daily?: Record<string, unknown>;
        weekly?: Record<string, unknown>;
      }>('get-missions', {});

      if (error) {
        console.error('[useMissions] Erro:', error);
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      setState({
        daily: data?.daily ? adaptDaily(data.daily) : null,
        weekly: data?.weekly ? adaptWeekly(data.weekly) : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [userId, isSessionLoaded]);

  useEffect(() => {
    void fetchMissions();
  }, [fetchMissions]);

  const updateProgress = useCallback(
    async (scope: 'daily' | 'weekly', missionId: string, amount = 1) => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          mission?: DailyMission | WeeklyChallenge;
          allCompleted?: boolean;
        }>('update-missions', {
          body: {
            action: 'progress',
            scope,
            missionId,
            amount,
          },
        });

        if (error || !data?.success) {
          console.error('[useMissions] Erro ao atualizar:', error);
          return false;
        }

        // Atualizar estado local
        setState((prev) => {
          if (scope === 'daily' && prev.daily) {
            const updatedMissions = prev.daily.missions.map((m) =>
              m.id === missionId ? { ...m, current: data.mission?.current ?? m.current, completed: data.mission?.completed ?? m.completed } : m
            );
            return {
              ...prev,
              daily: { ...prev.daily, missions: updatedMissions, allCompleted: data.allCompleted ?? prev.daily.allCompleted },
            };
          }
          if (scope === 'weekly' && prev.weekly) {
            const updatedChallenges = prev.weekly.challenges.map((c) =>
              c.id === missionId ? { ...c, current: data.mission?.current ?? c.current, completed: data.mission?.completed ?? c.completed } : c
            );
            return {
              ...prev,
              weekly: { ...prev.weekly, challenges: updatedChallenges, allCompleted: data.allCompleted ?? prev.weekly.allCompleted },
            };
          }
          return prev;
        });

        return true;
      } catch (err) {
        console.error('[useMissions] Erro:', err);
        return false;
      }
    },
    []
  );

  const claimReward = useCallback(
    async (scope: 'daily' | 'weekly', missionId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          mission?: DailyMission | WeeklyChallenge;
          reward?: { type: string; amount: number };
          allClaimed?: boolean;
        }>('update-missions', {
          body: {
            action: 'claim',
            scope,
            missionId,
          },
        });

        if (error || !data?.success) {
          console.error('[useMissions] Erro ao reivindicar:', error);
          return null;
        }

        // Atualizar estado local
        setState((prev) => {
          if (scope === 'daily' && prev.daily) {
            const updatedMissions = prev.daily.missions.map((m) =>
              m.id === missionId ? { ...m, claimed: true } : m
            );
            return {
              ...prev,
              daily: { ...prev.daily, missions: updatedMissions, allClaimed: data.allClaimed ?? prev.daily.allClaimed },
            };
          }
          if (scope === 'weekly' && prev.weekly) {
            const updatedChallenges = prev.weekly.challenges.map((c) =>
              c.id === missionId ? { ...c, claimed: true } : c
            );
            return {
              ...prev,
              weekly: { ...prev.weekly, challenges: updatedChallenges, allClaimed: data.allClaimed ?? prev.weekly.allClaimed },
            };
          }
          return prev;
        });

        return data.reward ?? null;
      } catch (err) {
        console.error('[useMissions] Erro:', err);
        return null;
      }
    },
    []
  );

  const getActiveDailyMissions = useCallback(() => {
    return state.daily?.missions.filter((m) => !m.claimed) || [];
  }, [state.daily]);

  const getActiveWeeklyChallenges = useCallback(() => {
    return state.weekly?.challenges.filter((c) => !c.claimed) || [];
  }, [state.weekly]);

  const getCompletedCount = useCallback(() => {
    const dailyCompleted = state.daily?.missions.filter((m) => m.completed && !m.claimed).length ?? 0;
    const weeklyCompleted = state.weekly?.challenges.filter((c) => c.completed && !c.claimed).length ?? 0;
    return dailyCompleted + weeklyCompleted;
  }, [state.daily, state.weekly]);

  return {
    daily: state.daily,
    weekly: state.weekly,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchMissions,
    updateProgress,
    claimReward,
    getActiveDailyMissions,
    getActiveWeeklyChallenges,
    getCompletedCount,
  };
}
