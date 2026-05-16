import type { SupabaseClient, User } from '@supabase/supabase-js';
import { MOCK_USER } from '@/mocks/data';

export const GUEST_ACCOUNT_STORAGE_KEY = 'bool_guest_account';

export interface GuestAccount {
  id: string;
  username: string;
  level: number;
  xp: number;
  xp_to_next: number;
  rank: string;
  currencies: {
    coins: number;
    cash: number;
  };
  stats: typeof MOCK_USER.stats;
  equipment: {
    currentCue: string;
    ownedCues: string[];
    currentTable: string;
    ownedTables: string[];
  };
  inventory: typeof MOCK_USER.inventory;
  social: typeof MOCK_USER.social;
  settings: typeof MOCK_USER.settings;
  createdAt: string;
  updatedAt: string;
}

type GuestAccountUpdate = Partial<Omit<GuestAccount, 'id' | 'createdAt'>> & {
  id?: string;
  createdAt?: string;
};

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function createGuestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `guest_${crypto.randomUUID()}`;
  }
  return `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createGuestNickname(): string {
  const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
  return `Jogador#${suffix}`;
}

function createDefaultGuest(): GuestAccount {
  const now = new Date().toISOString();
  return {
    id: createGuestId(),
    username: createGuestNickname(),
    level: MOCK_USER.level,
    xp: MOCK_USER.currentXP,
    xp_to_next: MOCK_USER.nextLevelXP,
    rank: MOCK_USER.rank,
    currencies: {
      coins: MOCK_USER.currencies.coins,
      cash: MOCK_USER.currencies.cash,
    },
    stats: { ...MOCK_USER.stats },
    equipment: {
      currentCue: MOCK_USER.equipment.currentCue,
      ownedCues: [...MOCK_USER.equipment.ownedCues],
      currentTable: MOCK_USER.equipment.currentTable,
      ownedTables: [...MOCK_USER.equipment.ownedTables],
    },
    inventory: {
      spins: MOCK_USER.inventory.spins,
      scratchCards: MOCK_USER.inventory.scratchCards,
      boosters: { ...MOCK_USER.inventory.boosters },
    },
    social: { ...MOCK_USER.social },
    settings: { ...MOCK_USER.settings },
    createdAt: now,
    updatedAt: now,
  };
}

function persistGuest(account: GuestAccount): GuestAccount {
  const storage = getBrowserStorage();
  if (!storage) return account;
  storage.setItem(GUEST_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  return account;
}

export function getAuthDisplayName(user: User | null): string {
  if (!user) return 'Jogador';

  const metadata = user.user_metadata;
  const metadataName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : typeof metadata.user_name === 'string'
          ? metadata.user_name
          : '';

  return metadataName.trim() || user.email || 'Jogador';
}

export const GuestAccountManager = {
  create(): GuestAccount {
    const existing = this.get();
    if (existing) return existing;
    return persistGuest(createDefaultGuest());
  },

  get(): GuestAccount | null {
    const storage = getBrowserStorage();
    if (!storage) return null;

    const raw = storage.getItem(GUEST_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as GuestAccount;
    } catch {
      storage.removeItem(GUEST_ACCOUNT_STORAGE_KEY);
      return null;
    }
  },

  update(update: GuestAccountUpdate): GuestAccount {
    const current = this.get() ?? createDefaultGuest();
    return persistGuest({
      ...current,
      ...update,
      currencies: update.currencies ?? current.currencies,
      stats: update.stats ?? current.stats,
      equipment: update.equipment ?? current.equipment,
      inventory: update.inventory ?? current.inventory,
      social: update.social ?? current.social,
      settings: update.settings ?? current.settings,
      updatedAt: new Date().toISOString(),
    });
  },

  clear(): void {
    const storage = getBrowserStorage();
    if (!storage) return;
    storage.removeItem(GUEST_ACCOUNT_STORAGE_KEY);
  },

  exists(): boolean {
    return this.get() !== null;
  },

  async migrateToAuth(userId: string, supabase: SupabaseClient): Promise<boolean> {
    const guest = this.get();
    if (!guest) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email = user?.email ?? `${userId}@guest.bool.local`;
    const username = getAuthDisplayName(user);

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      email,
      level: guest.level,
      xp: guest.xp,
      xp_to_next: guest.xp_to_next,
      coins: guest.currencies.coins,
      cash: guest.currencies.cash,
      stats: guest.stats,
      current_cue: guest.equipment.currentCue,
      owned_cues: guest.equipment.ownedCues,
      current_table: guest.equipment.currentTable,
      owned_tables: guest.equipment.ownedTables,
      settings: guest.settings,
    });

    if (error) throw error;

    this.clear();
    if (typeof document !== 'undefined') {
      document.cookie = 'bool_guest=; path=/; max-age=0; SameSite=Strict';
    }
    return true;
  },
};
