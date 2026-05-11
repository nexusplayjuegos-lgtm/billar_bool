'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import type { VictoryBox, BoxType, BoxReward } from '@/types';
import { getTimeRemaining, getMaxSlots, determineBoxType } from '@/types/victoryBox';

interface VictoryBoxState {
  boxes: VictoryBox[];
  isLoading: boolean;
  error: string | null;
}

function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function adaptBox(raw: Record<string, unknown>): VictoryBox {
  const data = snakeToCamel(raw);
  return {
    id: String(data.id ?? ''),
    profileId: String(data.profileId ?? ''),
    boxType: String(data.boxType ?? 'common') as BoxType,
    status: String(data.status ?? 'locked') as VictoryBox['status'],
    unlockStartedAt: data.unlockStartedAt ? String(data.unlockStartedAt) : null,
    unlockDurationSeconds: Number(data.unlockDurationSeconds ?? 10800),
    rewards: (data.rewards as BoxReward[]) || [],
    openedAt: data.openedAt ? String(data.openedAt) : null,
    createdAt: String(data.createdAt ?? ''),
  };
}

export function useVictoryBoxes(hasElite = false) {
  const [state, setState] = useState<VictoryBoxState>({ boxes: [], isLoading: true, error: null });
  const { session, isSessionLoaded, profile } = useUserStore();
  const userId = session?.user?.id ?? null;

  const fetchBoxes = useCallback(async () => {
    if (!userId || !isSessionLoaded) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('victory_boxes')
        .select('*')
        .eq('profile_id', userId)
        .neq('status', 'opened')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useVictoryBoxes] Erro:', error);
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      const boxes = (data || []).map((raw) => adaptBox(raw as Record<string, unknown>));
      setState({ boxes, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [userId, isSessionLoaded]);

  // Busca inicial
  useEffect(() => {
    void fetchBoxes();
  }, [fetchBoxes]);

  // Polling a cada 30s
  useEffect(() => {
    if (!userId) return;
    const interval = window.setInterval(() => {
      void fetchBoxes();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [userId, fetchBoxes]);

  const createBox = useCallback(
    async (boxType: BoxType, winStreak = 0, mode: '1v1' | 'tournament' | '8ball' | 'brazilian' = '8ball') => {
      if (!userId) return null;

      const determinedType = boxType || determineBoxType(winStreak, mode);

      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean; box?: Record<string, unknown>; converted?: boolean; fallbackCoins?: number }>(
          'create-box',
          {
            body: {
              box_type: determinedType,
              has_elite: hasElite,
            },
          }
        );

        if (error) {
          console.error('[useVictoryBoxes] Erro ao criar box:', error);
          return null;
        }

        if (data?.converted && data.fallbackCoins) {
          // Atualizar coins localmente
          await fetchBoxes();
          return { converted: true, fallbackCoins: data.fallbackCoins } as const;
        }

        if (data?.box) {
          const newBox = adaptBox(data.box);
          setState((prev) => ({
            ...prev,
            boxes: [newBox, ...prev.boxes].slice(0, getMaxSlots(hasElite)),
          }));
          return { converted: false, box: newBox } as const;
        }

        return null;
      } catch (err) {
        console.error('[useVictoryBoxes] Erro:', err);
        return null;
      }
    },
    [userId, hasElite, fetchBoxes]
  );

  const startUnlock = useCallback(
    async (boxId: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean; started?: boolean }>('open-box', {
          body: { box_id: boxId },
        });

        if (error || !data?.success) {
          console.error('[useVictoryBoxes] Erro ao iniciar unlock:', error);
          return false;
        }

        setState((prev) => ({
          ...prev,
          boxes: prev.boxes.map((b) =>
            b.id === boxId
              ? { ...b, status: 'unlocking' as const, unlockStartedAt: new Date().toISOString() }
              : b
          ),
        }));
        return true;
      } catch (err) {
        console.error('[useVictoryBoxes] Erro:', err);
        return false;
      }
    },
    []
  );

  const openBox = useCallback(
    async (boxId: string): Promise<{ success: boolean; rewards?: BoxReward[]; boxType?: BoxType }> => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          rewards?: BoxReward[];
          boxType?: BoxType;
        }>('open-box', {
          body: { box_id: boxId },
        });

        if (error || !data?.success) {
          console.error('[useVictoryBoxes] Erro ao abrir:', error);
          return { success: false };
        }

        setState((prev) => ({
          ...prev,
          boxes: prev.boxes.filter((b) => b.id !== boxId),
        }));

        return { success: true, rewards: data.rewards, boxType: data.boxType };
      } catch (err) {
        console.error('[useVictoryBoxes] Erro:', err);
        return { success: false };
      }
    },
    []
  );

  const accelerateBox = useCallback(
    async (boxId: string): Promise<{ success: boolean; cost?: number }> => {
      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean; cost?: number }>('accelerate-box', {
          body: { box_id: boxId },
        });

        if (error || !data?.success) {
          console.error('[useVictoryBoxes] Erro ao acelerar:', error);
          return { success: false };
        }

        // Atualizar estado local como pronta
        setState((prev) => ({
          ...prev,
          boxes: prev.boxes.map((b) =>
            b.id === boxId
              ? { ...b, unlockStartedAt: new Date(Date.now() - b.unlockDurationSeconds * 1000).toISOString() }
              : b
          ),
        }));

        return { success: true, cost: data.cost };
      } catch (err) {
        console.error('[useVictoryBoxes] Erro:', err);
        return { success: false };
      }
    },
    []
  );

  const getReadyBoxes = useCallback(() => {
    return state.boxes.filter((box) => {
      if (box.status === 'locked') return false;
      if (box.status === 'unlocking' && box.unlockStartedAt) {
        const remaining = getTimeRemaining(box);
        return remaining <= 0;
      }
      return false;
    });
  }, [state.boxes]);

  const getUnlockingBoxes = useCallback(() => {
    return state.boxes.filter((box) => box.status === 'unlocking');
  }, [state.boxes]);

  const getLockedBoxes = useCallback(() => {
    return state.boxes.filter((box) => box.status === 'locked');
  }, [state.boxes]);

  const slotsUsed = state.boxes.length;
  const maxSlots = getMaxSlots(hasElite);
  const slotsAvailable = Math.max(0, maxSlots - slotsUsed);

  return {
    boxes: state.boxes,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchBoxes,
    createBox,
    startUnlock,
    openBox,
    accelerateBox,
    getReadyBoxes,
    getUnlockingBoxes,
    getLockedBoxes,
    slotsUsed,
    maxSlots,
    slotsAvailable,
  };
}
