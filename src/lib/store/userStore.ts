import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, fetchProfile } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';
import { MOCK_USER } from '@/mocks/data';

const defaultProfile = {
  id: MOCK_USER.id,
  username: MOCK_USER.username,
  level: MOCK_USER.level,
  xp: MOCK_USER.currentXP,
  xp_to_next: MOCK_USER.nextLevelXP,
  rank: MOCK_USER.rank,
  currencies: {
    coins: MOCK_USER.currencies.coins,
    cash: MOCK_USER.currencies.cash,
  },
  stats: MOCK_USER.stats,
  equipment: {
    currentCue: MOCK_USER.equipment.currentCue,
    ownedCues: MOCK_USER.equipment.ownedCues,
    currentTable: MOCK_USER.equipment.currentTable,
    ownedTables: MOCK_USER.equipment.ownedTables,
  },
  social: MOCK_USER.social,
  settings: MOCK_USER.settings,
};

interface DbProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xp_to_next?: number;
  coins: number;
  cash: number;
  stats?: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    maxWinStreak: number;
    currentWinStreak: number;
    totalCoinsWon: number;
  };
  current_cue: string;
  owned_cues?: string[];
  current_table?: string;
  owned_tables?: string[];
  settings?: typeof defaultProfile.settings;
}

function adaptProfile(db: DbProfile) {
  return {
    ...defaultProfile,
    id: db.id,
    username: db.username,
    level: db.level ?? 1,
    xp: db.xp ?? 0,
    xp_to_next: db.xp_to_next ?? 1000,
    currencies: {
      coins: db.coins ?? 5000,
      cash: db.cash ?? 0,
    },
    stats: db.stats ?? defaultProfile.stats,
    equipment: {
      currentCue: db.current_cue ?? 'cue_beginner',
      ownedCues: db.owned_cues ?? ['cue_beginner'],
      currentTable: db.current_table ?? 'table_classic_green',
      ownedTables: db.owned_tables ?? ['table_classic_green'],
    },
    settings: db.settings ?? defaultProfile.settings,
  };
}

interface UserState {
  profile: any;
  session: any | null;
  isLoading: boolean;
  isOnline: boolean;
  isGuest: boolean;

  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  playAsGuest: () => void;

  addCoins: (amount: number) => Promise<void>;
  removeCoins: (amount: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  saveMatchResult: (result: any) => Promise<void>;
  buyCue: (cueId: string, price: number) => Promise<void>;
  equipCue: (cueId: string) => Promise<void>;
  updateStats: (result: 'win' | 'loss', coinsWon?: number) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      session: null,
      isLoading: false,
      isOnline: true,
      isGuest: false,

      playAsGuest: () => {
        const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
        set({
          isGuest: true,
          session: null,
          profile: {
            ...defaultProfile,
            id: `guest_${suffix}`,
            username: `Convidado_${suffix}`,
          },
        });
        if (typeof window !== 'undefined') {
          document.cookie = 'bool_guest=1; path=/; max-age=86400; SameSite=Strict';
        }
      },

      updateStats: async (result: 'win' | 'loss', coinsWon: number = 0) => {
        const { profile, session } = get();
        if (!profile) return;

        const currentStats = profile.stats || {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          maxWinStreak: 0,
          currentWinStreak: 0,
          totalCoinsWon: 0,
        };

        const newStats = {
          ...currentStats,
          totalGames: (profile.stats?.totalGames || 0) + 1,
          wins: result === 'win'
            ? (profile.stats?.wins || 0) + 1
            : (profile.stats?.wins || 0),
          losses: result === 'loss'
            ? (profile.stats?.losses || 0) + 1
            : (profile.stats?.losses || 0),
        };
        newStats.winRate = Math.round((newStats.wins / newStats.totalGames) * 100);

        if (result === 'win') {
          newStats.currentWinStreak = (profile.stats?.currentWinStreak || 0) + 1;
          newStats.maxWinStreak = Math.max(
            newStats.currentWinStreak,
            profile.stats?.maxWinStreak || 0
          );
        } else {
          newStats.currentWinStreak = 0;
        }

        if (coinsWon > 0) {
          newStats.totalCoinsWon = (profile.stats?.totalCoinsWon || 0) + coinsWon;
        }

        set({ profile: { ...profile, stats: newStats } });

        if (session) {
          await supabase
            .from('profiles')
            .update({ stats: newStats })
            .eq('id', session.user.id);
        }
      },

      equipCue: async (cueId: string) => {
        const { profile, session } = get();
        if (!profile) return;

        if (!profile.equipment?.ownedCues?.includes(cueId)) {
          console.error('User does not own this cue');
          return;
        }

        const updatedProfile = {
          ...profile,
          equipment: { ...profile.equipment, currentCue: cueId },
        };

        set({ profile: updatedProfile });

        if (session) {
          const { error } = await supabase
            .from('profiles')
            .update({ current_cue: cueId })
            .eq('id', session.user.id);

          if (error) {
            console.error('Error equipping cue:', error);
          }
        }
      },

      // ========== AUTH ==========
      signUp: async (email, password, username) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });
          if (error) throw error;
          set({ session: data.session });
          if (data.session && typeof window !== 'undefined') {
            document.cookie = 'bool_auth=1; path=/; max-age=604800; SameSite=Strict';
          }
        } finally {
          set({ isLoading: false });
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          const profile = await fetchProfile(data.user.id);
          set({
            session: data.session,
            profile: profile ? adaptProfile(profile) : defaultProfile,
          });
          if (typeof window !== 'undefined') {
            document.cookie = 'bool_auth=1; path=/; max-age=604800; SameSite=Strict';
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // ── FIX: repor defaultProfile em vez de null + redirecionar ──
      signOut: async () => {
        await supabase.auth.signOut();
        // Repor perfil de demonstração em vez de null
        // Evita crashes em componentes que acedem a profile.username sem guard
        set({ session: null, profile: defaultProfile, isGuest: false });
        if (typeof window !== 'undefined') {
          document.cookie = 'bool_auth=; path=/; max-age=0; SameSite=Strict';
          document.cookie = 'bool_guest=; path=/; max-age=0; SameSite=Strict';
          const locale = window.location.pathname.split('/')[1] ?? 'es';
          window.location.href = `/${locale}`;
        }
      },

      loadSession: async () => {
        const user = await getCurrentUser();
        if (user) {
          const profile = await fetchProfile(user.id);
          if (profile) set({ profile: adaptProfile(profile) });
        }
      },

      // ========== ECONOMIA ==========
      addCoins: async (amount) => {
        const { profile, session } = get();
        if (!profile) return;

        const newCoins = profile.currencies.coins + amount;
        set({ profile: { ...profile, currencies: { ...profile.currencies, coins: newCoins } } });

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins })
            .eq('id', session.user.id);
        }
      },

      removeCoins: async (amount) => {
        const { profile, session } = get();
        if (!profile) return;

        const newCoins = Math.max(0, profile.currencies.coins - amount);
        set({ profile: { ...profile, currencies: { ...profile.currencies, coins: newCoins } } });

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins })
            .eq('id', session.user.id);
        }
      },

      addXP: async (amount) => {
        const { profile, session } = get();
        if (!profile) return;

        let newXP = profile.xp + amount;
        let newLevel = profile.level;
        let newXPToNext = profile.xp_to_next;

        while (newXP >= newXPToNext) {
          newXP -= newXPToNext;
          newLevel += 1;
          newXPToNext = newLevel * 1000;
        }

        const updatedProfile = {
          ...profile,
          xp: newXP,
          level: newLevel,
          xp_to_next: newXPToNext,
        };

        set({ profile: updatedProfile });

        if (session) {
          await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel, xp_to_next: newXPToNext })
            .eq('id', session.user.id);
        }
      },

      // ========== PARTIDAS ==========
      saveMatchResult: async (result) => {
        const { profile, session } = get();
        if (!session || !profile) return;

        await supabase.from('matches').insert({
          player_id: session.user.id,
          mode: result.mode,
          result: result.result,
          coins_bet: result.coinsBet,
          coins_won: result.coinsWon,
          xp_gained: result.xpGained,
        });

        const newStats = {
          ...profile.stats,
          totalGames: profile.stats.totalGames + 1,
          wins: result.result === 'win'
            ? profile.stats.wins + 1
            : profile.stats.wins,
          losses: result.result === 'loss'
            ? profile.stats.losses + 1
            : profile.stats.losses,
        };
        newStats.winRate = Math.round((newStats.wins / newStats.totalGames) * 100);

        await supabase
          .from('profiles')
          .update({ stats: newStats })
          .eq('id', session.user.id);

        set({ profile: { ...profile, stats: newStats } });
      },

      // ========== LOJA ==========
      buyCue: async (cueId, price) => {
        const { profile, session } = get();
        if (!profile || profile.currencies.coins < price) return;

        const newCoins = profile.currencies.coins - price;
        const newOwnedCues = [...profile.equipment.ownedCues, cueId];

        set({
          profile: {
            ...profile,
            currencies: { ...profile.currencies, coins: newCoins },
            equipment: { ...profile.equipment, ownedCues: newOwnedCues },
          },
        });

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins, owned_cues: newOwnedCues })
            .eq('id', session.user.id);
        }
      },
    }),
    {
      name: 'bool-user-storage',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);