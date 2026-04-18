'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Currencies, Equipment } from '@/types';
import { NEW_PLAYER } from '@/mocks/data';

interface UserState {
  user: User;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  updateCurrencies: (currencies: Partial<Currencies>) => void;
  updateEquipment: (equipment: Partial<Equipment>) => void;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  addCash: (amount: number) => void;
  addXP: (amount: number) => void;
  levelUp: () => void;
  updateStats: (result: 'win' | 'loss', coinsWon?: number) => void;
  buyCue: (cueId: string, price: Currencies) => boolean;
  equipCue: (cueId: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: NEW_PLAYER,
      isLoading: false,

      setUser: (user) => set({ user }),

      updateCurrencies: (currencies) =>
        set((state) => ({
          user: {
            ...state.user,
            currencies: { ...state.user.currencies, ...currencies },
          },
        })),

      updateEquipment: (equipment) =>
        set((state) => ({
          user: {
            ...state.user,
            equipment: { ...state.user.equipment, ...equipment },
          },
        })),

      addCoins: (amount) =>
        set((state) => ({
          user: {
            ...state.user,
            currencies: {
              ...state.user.currencies,
              coins: state.user.currencies.coins + amount,
            },
          },
        })),

      removeCoins: (amount) =>
        set((state) => ({
          user: {
            ...state.user,
            currencies: {
              ...state.user.currencies,
              coins: Math.max(0, state.user.currencies.coins - amount),
            },
          },
        })),

      addCash: (amount) =>
        set((state) => ({
          user: {
            ...state.user,
            currencies: {
              ...state.user.currencies,
              cash: state.user.currencies.cash + amount,
            },
          },
        })),

      addXP: (amount) =>
        set((state) => {
          let newXP = state.user.currentXP + amount;
          let newLevel = state.user.level;
          let newNextLevelXP = state.user.nextLevelXP;
          // Level up loop para múltiplos levels de uma vez
          while (newXP >= newNextLevelXP) {
            newXP -= newNextLevelXP;
            newLevel += 1;
            newNextLevelXP = Math.floor(newNextLevelXP * 1.2);
          }
          return {
            user: {
              ...state.user,
              currentXP: newXP,
              nextLevelXP: newNextLevelXP,
              level: newLevel,
            },
          };
        }),

      levelUp: () =>
        set((state) => ({
          user: {
            ...state.user,
            level: state.user.level + 1,
            currentXP: 0,
            nextLevelXP: Math.floor(state.user.nextLevelXP * 1.2),
          },
        })),

      updateStats: (result, coinsWon = 0) =>
        set((state) => {
          const newStats = { ...state.user.stats };
          newStats.totalGames += 1;
          if (result === 'win') {
            newStats.wins += 1;
            newStats.currentWinStreak += 1;
            newStats.maxWinStreak = Math.max(newStats.maxWinStreak, newStats.currentWinStreak);
            newStats.totalCoinsWon += coinsWon;
          } else {
            newStats.losses += 1;
            newStats.currentWinStreak = 0;
          }
          newStats.winRate = Math.round((newStats.wins / newStats.totalGames) * 100);
          return { user: { ...state.user, stats: newStats } };
        }),

      buyCue: (cueId, price) => {
        const state = get();
        if (
          state.user.currencies.coins >= price.coins &&
          state.user.currencies.cash >= price.cash
        ) {
          set((state) => ({
            user: {
              ...state.user,
              currencies: {
                coins: state.user.currencies.coins - price.coins,
                cash: state.user.currencies.cash - price.cash,
              },
              equipment: {
                ...state.user.equipment,
                ownedCues: [...state.user.equipment.ownedCues, cueId],
              },
            },
          }));
          return true;
        }
        return false;
      },

      equipCue: (cueId) =>
        set((state) => ({
          user: {
            ...state.user,
            equipment: {
              ...state.user.equipment,
              currentCue: cueId,
            },
          },
        })),

      reset: () => set({ user: NEW_PLAYER }),
    }),
    {
      name: 'bool-user-storage',
      version: 1,
    }
  )
);
