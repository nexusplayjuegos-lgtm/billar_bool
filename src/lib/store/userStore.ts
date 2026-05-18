import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Provider, Session } from '@supabase/supabase-js';
import type { Price } from '@/types';
import { supabase, fetchProfile } from '../supabase/client';
import { MOCK_USER } from '@/mocks/data';
import { GuestAccountManager, getAuthDisplayName, type GuestAccount } from '@/lib/auth/guestAccount';

const TABLE_ID_ALIASES: Record<string, string> = {
  table_classic_green: 'classic-green',
  table_blue_velvet: 'midnight-blue',
};
const PRODUCTION_SITE_URL = 'https://8bollpool.com/';

function normalizeTableId(tableId: string): string {
  return TABLE_ID_ALIASES[tableId] ?? tableId;
}

function normalizeTableIds(tableIds: string[]): string[] {
  return Array.from(new Set(tableIds.map(normalizeTableId)));
}

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
    currentTable: normalizeTableId(MOCK_USER.equipment.currentTable),
    ownedTables: normalizeTableIds(MOCK_USER.equipment.ownedTables),
  },
  social: MOCK_USER.social,
  settings: MOCK_USER.settings,
};

type UserProfile = typeof defaultProfile;

interface MatchResult {
  mode: string;
  result: 'win' | 'loss' | 'draw';
  coinsBet: number;
  coinsWon: number;
  xpGained: number;
}

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
    stats: { ...defaultProfile.stats, ...db.stats },
    equipment: {
      currentCue: db.current_cue ?? 'cue_beginner',
      ownedCues: db.owned_cues ?? ['cue_beginner'],
      currentTable: normalizeTableId(db.current_table ?? 'classic-green'),
      ownedTables: normalizeTableIds(db.owned_tables ?? ['classic-green']),
    },
    settings: db.settings ?? defaultProfile.settings,
  };
}

function adaptGuestProfile(guest: GuestAccount): UserProfile {
  return {
    ...defaultProfile,
    id: guest.id,
    username: guest.username,
    level: guest.level,
    xp: guest.xp,
    xp_to_next: guest.xp_to_next,
    rank: guest.rank,
    currencies: guest.currencies,
    stats: guest.stats,
    equipment: {
      currentCue: guest.equipment.currentCue,
      ownedCues: guest.equipment.ownedCues,
      currentTable: normalizeTableId(guest.equipment.currentTable),
      ownedTables: normalizeTableIds(guest.equipment.ownedTables),
    },
    social: guest.social,
    settings: guest.settings,
  };
}

function createAuthFallbackProfile(session: Session): UserProfile {
  return {
    ...defaultProfile,
    id: session.user.id,
    username: getAuthDisplayName(session.user),
  };
}

function isGuestDisplayName(username: string): boolean {
  return username.startsWith('Jogador#') || username.startsWith('Convidado_');
}

function persistGuestProfile(profile: UserProfile, isGuest: boolean): void {
  if (!isGuest) return;
  GuestAccountManager.update({
    username: profile.username,
    level: profile.level,
    xp: profile.xp,
    xp_to_next: profile.xp_to_next,
    rank: profile.rank,
    currencies: profile.currencies,
    stats: profile.stats,
    equipment: profile.equipment,
    social: profile.social,
    settings: profile.settings,
  });
}

function getSiteUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  if (explicitUrl) {
    return explicitUrl.endsWith('/') ? explicitUrl : `${explicitUrl}/`;
  }

  if (vercelUrl) {
    const normalized = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }

  return PRODUCTION_SITE_URL;
}

interface UserState {
  profile: UserProfile;
  session: Session | null;
  isLoading: boolean;
  isSessionLoaded: boolean;
  isOnline: boolean;
  isGuest: boolean;

  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  playAsGuest: () => Promise<string | null>;
  migrateGuestToAuth: () => Promise<void>;

  addCoins: (amount: number) => Promise<void>;
  removeCoins: (amount: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  saveMatchResult: (result: MatchResult) => Promise<void>;
  buyCue: (cueId: string, price: number) => Promise<void>;
  equipCue: (cueId: string) => Promise<void>;
  buyTable: (tableId: string, price: Price) => Promise<void>;
  equipTable: (tableId: string) => Promise<void>;
  addPoolPoints: (amount: number, seasonId?: string) => Promise<void>;
  updateStats: (result: 'win' | 'loss', coinsWon?: number) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      session: null,
      isLoading: false,
      isSessionLoaded: false,
      isOnline: true,
      isGuest: false,

      playAsGuest: async () => {
        const guest = GuestAccountManager.create();
        const guestProfile = adaptGuestProfile(guest);

        set({ isGuest: true, session: null, profile: guestProfile, isSessionLoaded: true });
        if (typeof window !== 'undefined') {
          document.cookie = 'bool_guest=1; path=/; max-age=31536000; SameSite=Strict';
        }
        return guest.id;
      },

      addPoolPoints: async (amount: number, seasonId?: string) => {
    const { session } = get();
    if (!session || !seasonId) return;

    const { data: progress } = await supabase
      .from('player_season_progress')
      .select('pool_points, current_rank')
      .eq('profile_id', session.user.id)
      .eq('season_id', seasonId)
      .single();

    if (!progress) return;

    const newPoints = (progress.pool_points || 0) + amount;
    const newRank = Math.min(50, Math.floor(newPoints / 100) + 1);

    await supabase
      .from('player_season_progress')
      .update({ pool_points: newPoints, current_rank: newRank })
      .eq('profile_id', session.user.id)
      .eq('season_id', seasonId);
  },

  updateStats: async (result: 'win' | 'loss', coinsWon: number = 0) => {
        const { profile, session, isGuest } = get();
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

        const updatedProfile = { ...profile, stats: newStats };
        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({ stats: newStats })
            .eq('id', session.user.id);
        }
      },

      equipCue: async (cueId: string) => {
        const { profile, session, isGuest } = get();
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
        persistGuestProfile(updatedProfile, isGuest);

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
          if (data.session?.user.id) {
            await GuestAccountManager.migrateToAuth(data.session.user.id, supabase);
          }
          set({
            session: data.session,
            isGuest: false,
            profile: data.session ? createAuthFallbackProfile(data.session) : defaultProfile,
          });
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

          await GuestAccountManager.migrateToAuth(data.user.id, supabase);
          const profile = await fetchProfile(data.user.id);
          const authFallback = createAuthFallbackProfile(data.session);
          set({
            session: data.session,
            isGuest: false,
            profile: profile ? adaptProfile(profile) : authFallback,
          });
          if (typeof window !== 'undefined') {
            document.cookie = 'bool_auth=1; path=/; max-age=604800; SameSite=Strict';
          }
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithOAuth: async (provider) => {
        const authProvider: Provider = provider;
        if (typeof window !== 'undefined') {
          const locale = window.location.pathname.split('/')[1] || 'pt';
          window.localStorage.setItem('bool_auth_redirect_locale', locale);
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: authProvider,
          options: {
            redirectTo: `${getSiteUrl()}auth/callback`,
          },
        });
        if (error) throw error;
      },

      // ── FIX: repor defaultProfile em vez de null + redirecionar ──
      signOut: async () => {
        await supabase.auth.signOut();
        // Repor perfil de demonstração em vez de null
        // Evita crashes em componentes que acedem a profile.username sem guard
        set({ session: null, profile: defaultProfile, isGuest: false });
        GuestAccountManager.clear();
        if (typeof window !== 'undefined') {
          document.cookie = 'bool_auth=; path=/; max-age=0; SameSite=Strict';
          document.cookie = 'bool_guest=; path=/; max-age=0; SameSite=Strict';
          const locale = window.location.pathname.split('/')[1] ?? 'es';
          window.location.href = `/${locale}`;
        }
      },

      loadSession: async () => {
        console.log('[userStore] loadSession iniciando...');
        set({ isSessionLoaded: false });
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('[userStore] getSession result:', { hasSession: !!session, error: error?.message });
          
          if (!session) {
            console.log('[userStore] Sem sessão no Supabase');
            const guest = GuestAccountManager.get();
            if (guest) {
              set({ profile: adaptGuestProfile(guest), isGuest: true, session: null });
              if (typeof window !== 'undefined') {
                document.cookie = 'bool_guest=1; path=/; max-age=31536000; SameSite=Strict';
              }
            }
            set({ isSessionLoaded: true });
            return;
          }

          console.log('[userStore] Sessão encontrada, userId:', session.user.id);
          const authFallback = createAuthFallbackProfile(session);
          set({ session, isGuest: false, profile: authFallback });
          await GuestAccountManager.migrateToAuth(session.user.id, supabase);

          if (typeof window !== 'undefined') {
            document.cookie = 'bool_auth=1; path=/; max-age=604800; SameSite=Strict';
            document.cookie = 'bool_guest=; path=/; max-age=0; SameSite=Strict';
          }

          const profile = await fetchProfile(session.user.id);
          console.log('[userStore] Profile do banco:', profile ? 'encontrado' : 'não encontrado');
          if (profile) {
            const authName = getAuthDisplayName(session.user);
            const shouldReplaceGuestName = isGuestDisplayName(profile.username) && authName !== 'Jogador';
            if (shouldReplaceGuestName) {
              await supabase.from('profiles').update({ username: authName }).eq('id', session.user.id);
            }
            set({ profile: adaptProfile({ ...profile, username: shouldReplaceGuestName ? authName : profile.username }) });
          }
        } catch (err) {
          console.error('[userStore] Erro em loadSession:', err);
        } finally {
          set({ isSessionLoaded: true });
          console.log('[userStore] loadSession concluído, isSessionLoaded=true');
        }
      },

      migrateGuestToAuth: async () => {
        const { session } = get();
        if (!session) return;
        await GuestAccountManager.migrateToAuth(session.user.id, supabase);
        const profile = await fetchProfile(session.user.id);
        const authFallback = createAuthFallbackProfile(session);
        set({
          profile: profile ? adaptProfile(profile) : authFallback,
          isGuest: false,
        });
        if (typeof window !== 'undefined') {
          document.cookie = 'bool_auth=1; path=/; max-age=604800; SameSite=Strict';
        }
      },

      // ========== ECONOMIA ==========
      addCoins: async (amount) => {
        const { profile, session, isGuest } = get();
        if (!profile) return;

        const newCoins = profile.currencies.coins + amount;
        const updatedProfile = { ...profile, currencies: { ...profile.currencies, coins: newCoins } };
        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins })
            .eq('id', session.user.id);
        }
      },

      removeCoins: async (amount) => {
        const { profile, session, isGuest } = get();
        if (!profile) return;

        const newCoins = Math.max(0, profile.currencies.coins - amount);
        const updatedProfile = { ...profile, currencies: { ...profile.currencies, coins: newCoins } };
        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins })
            .eq('id', session.user.id);
        }
      },

      addXP: async (amount) => {
        const { profile, session, isGuest } = get();
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
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel, xp_to_next: newXPToNext })
            .eq('id', session.user.id);
        }
      },

      // ========== PARTIDAS ==========
      saveMatchResult: async (result) => {
        const { profile, session, isGuest } = get();
        if (!profile) return;
        if (!session) {
          const resultKind = result.result === 'win' ? 'win' : 'loss';
          await get().updateStats(resultKind, result.coinsWon);
          return;
        }

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

        const updatedProfile = { ...profile, stats: newStats };
        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);
      },

      // ========== LOJA ==========
      buyCue: async (cueId, price) => {
        const { profile, session, isGuest } = get();
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
        persistGuestProfile(
          {
            ...profile,
            currencies: { ...profile.currencies, coins: newCoins },
            equipment: { ...profile.equipment, ownedCues: newOwnedCues },
          },
          isGuest
        );

        if (session) {
          await supabase
            .from('profiles')
            .update({ coins: newCoins, owned_cues: newOwnedCues })
            .eq('id', session.user.id);
        }
      },

      buyTable: async (tableId, price) => {
        const { profile, session, isGuest } = get();
        if (!profile) return;
        const normalizedTableId = normalizeTableId(tableId);
        if (profile.equipment.ownedTables.includes(normalizedTableId)) return;
        if (price.coins > 0 && profile.currencies.coins < price.coins) return;
        if (price.cash > 0 && profile.currencies.cash < price.cash) return;

        const newCoins = Math.max(0, profile.currencies.coins - price.coins);
        const newCash = Math.max(0, profile.currencies.cash - price.cash);
        const newOwnedTables = normalizeTableIds([...profile.equipment.ownedTables, normalizedTableId]);
        const updatedProfile = {
          ...profile,
          currencies: {
            ...profile.currencies,
            coins: newCoins,
            cash: newCash,
          },
          equipment: {
            ...profile.equipment,
            ownedTables: newOwnedTables,
            currentTable: normalizedTableId,
          },
        };

        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({
              coins: newCoins,
              cash: newCash,
              owned_tables: newOwnedTables,
              current_table: normalizedTableId,
            })
            .eq('id', session.user.id);
        }
      },

      equipTable: async (tableId) => {
        const { profile, session, isGuest } = get();
        if (!profile) return;
        const normalizedTableId = normalizeTableId(tableId);
        if (!profile.equipment.ownedTables.includes(normalizedTableId)) return;

        const updatedProfile = {
          ...profile,
          equipment: {
            ...profile.equipment,
            currentTable: normalizedTableId,
          },
        };

        set({ profile: updatedProfile });
        persistGuestProfile(updatedProfile, isGuest);

        if (session) {
          await supabase
            .from('profiles')
            .update({ current_table: normalizedTableId })
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
