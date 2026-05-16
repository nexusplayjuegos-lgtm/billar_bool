// ============================================================
// Tipos do Sistema de Conquistas
// Bool Sinuca Premiere
// ============================================================

export type AchievementCategory = 'wins' | 'skills' | 'collection' | 'social';
export type AchievementTier = 1 | 2 | 3 | 4;

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  targetValue: number;
  rewardCoins: number;
  rewardCash: number;
  rewardXp: number;
  iconUrl: string | null;
  createdAt: string;
}

export interface PlayerAchievement {
  id: string;
  profileId: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  completedAt: string | null;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementProgress extends Achievement {
  progress: PlayerAchievement;
}

export interface AchievementReward {
  coins: number;
  cash: number;
  xp: number;
}

export interface AchievementUpdateResult {
  updated: boolean;
  completed: boolean;
  achievement: AchievementProgress | null;
}
