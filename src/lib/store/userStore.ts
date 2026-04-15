'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Currencies, Equipment } from '@/types';
import { MOCK_USER } from '@/mocks/data';

interface UserState {
  user: User;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  updateCurrencies: (currencies: Partial<Currencies>) => void;
  updateEquipment: (equipment: Partial<Equipment>) => void;
  addXP: (amount: number) => void;
  levelUp: () => void;
  buyCue: (cueId: string, price: Currencies) => boolean;
  equipCue: (cueId: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: MOCK_USER,
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

      addXP: (amount) =>
        set((state) => {
          const newXP = state.user.currentXP + amount;
          if (newXP >= state.user.nextLevelXP) {
            return {
              user: {
                ...state.user,
                currentXP: newXP - state.user.nextLevelXP,
                nextLevelXP: Math.floor(state.user.nextLevelXP * 1.2),
                level: state.user.level + 1,
              },
            };
          }
          return {
            user: { ...state.user, currentXP: newXP },
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

      reset: () => set({ user: MOCK_USER }),
    }),
    {
      name: 'bool-user-storage',
    }
  )
);
