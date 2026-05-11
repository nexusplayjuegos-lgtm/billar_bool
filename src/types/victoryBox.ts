// ============================================================
// Tipos do Sistema Victory Boxes
// Bool Sinuca Premiere
// ============================================================

export type BoxType = 'common' | 'rare' | 'epic' | 'legendary';
export type BoxStatus = 'locked' | 'unlocking' | 'opened';

export interface BoxReward {
  type: 'coins' | 'cash' | 'cue' | 'table' | 'avatar' | 'title' | 'emote' | 'spin' | 'box' | 'xp';
  amount: number;
  itemId?: string;
  name?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface VictoryBox {
  id: string;
  profileId: string;
  boxType: BoxType;
  status: BoxStatus;
  unlockStartedAt: string | null;
  unlockDurationSeconds: number;
  rewards: BoxReward[];
  openedAt: string | null;
  createdAt: string;
}

export const BOX_DURATIONS: Record<BoxType, number> = {
  common: 3 * 60 * 60,    // 3h
  rare: 8 * 60 * 60,      // 8h
  epic: 12 * 60 * 60,     // 12h
  legendary: 24 * 60 * 60, // 24h
};

export const BOX_DURATIONS_ELITE: Record<BoxType, number> = {
  common: 1 * 60 * 60,    // 1h
  rare: Math.floor((8 * 60 * 60) / 3),      // ~2h40m
  epic: Math.floor((12 * 60 * 60) / 3),     // 4h
  legendary: Math.floor((24 * 60 * 60) / 3), // 8h
};

export const MAX_BOX_SLOTS = 4;
export const MAX_BOX_SLOTS_ELITE = 6;

export const BOX_COLORS: Record<BoxType, { border: string; bg: string; glow: string; text: string; icon: string }> = {
  common: {
    border: 'border-slate-400/50',
    bg: 'from-slate-600 to-slate-700',
    glow: 'shadow-slate-500/20',
    text: 'text-slate-300',
    icon: '📦',
  },
  rare: {
    border: 'border-blue-400/50',
    bg: 'from-blue-600 to-blue-700',
    glow: 'shadow-blue-500/30',
    text: 'text-blue-300',
    icon: '💎',
  },
  epic: {
    border: 'border-purple-400/50',
    bg: 'from-purple-600 to-purple-700',
    glow: 'shadow-purple-500/30',
    text: 'text-purple-300',
    icon: '🔮',
  },
  legendary: {
    border: 'border-amber-400/50',
    bg: 'from-amber-500 to-amber-600',
    glow: 'shadow-amber-500/40',
    text: 'text-amber-300',
    icon: '👑',
  },
};

export function getBoxDuration(boxType: BoxType, hasElite: boolean): number {
  return hasElite ? BOX_DURATIONS_ELITE[boxType] : BOX_DURATIONS[boxType];
}

export function getTimeRemaining(box: VictoryBox): number {
  if (box.status !== 'unlocking' || !box.unlockStartedAt) return 0;
  const started = new Date(box.unlockStartedAt).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, box.unlockDurationSeconds - elapsed);
}

export function getAccelerationCost(secondsRemaining: number): number {
  // Custo: 1 cash a cada 10 minutos restantes, mínimo 1
  const minutes = Math.ceil(secondsRemaining / 60);
  return Math.max(1, Math.ceil(minutes / 10));
}

export function formatBoxTimer(seconds: number): string {
  if (seconds <= 0) return 'Pronto!';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function getMaxSlots(hasElite: boolean): number {
  return hasElite ? MAX_BOX_SLOTS_ELITE : MAX_BOX_SLOTS;
}

export function determineBoxType(winStreak: number, mode: '1v1' | 'tournament' | '8ball' | 'brazilian'): BoxType {
  const rand = Math.random();
  // Base chances
  let legendaryChance = 0.02;
  let epicChance = 0.08;
  let rareChance = 0.25;

  // Win streak bonus
  if (winStreak >= 5) {
    legendaryChance += 0.03;
    epicChance += 0.07;
    rareChance += 0.1;
  } else if (winStreak >= 3) {
    legendaryChance += 0.01;
    epicChance += 0.04;
    rareChance += 0.08;
  }

  // Mode bonus
  if (mode === 'tournament') {
    legendaryChance += 0.03;
    epicChance += 0.05;
  }

  if (rand < legendaryChance) return 'legendary';
  if (rand < legendaryChance + epicChance) return 'epic';
  if (rand < legendaryChance + epicChance + rareChance) return 'rare';
  return 'common';
}
