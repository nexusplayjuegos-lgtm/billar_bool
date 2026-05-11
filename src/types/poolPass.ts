// ============================================================
// Tipos do Sistema Pool Pass (Season Pass)
// Bool Sinuca Premiere
// ============================================================

export type RewardType = 'coins' | 'cash' | 'cue' | 'table' | 'box' | 'avatar' | 'xp' | 'title' | 'emote' | 'spin';

export interface SeasonReward {
  type: RewardType;
  amount: number;
  itemId?: string;
  name?: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface SeasonTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundImage?: string;
  badgeIcon?: string;
  bannerImage?: string;
}

export interface SeasonPass {
  id: string;
  seasonNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  theme: SeasonTheme;
  freeRewards: SeasonReward[];
  premiumRewards: SeasonReward[];
  eliteRewards: SeasonReward[];
  createdAt: string;
}

export interface PlayerSeasonProgress {
  id: string;
  profileId: string;
  seasonId: string;
  currentRank: number;
  poolPoints: number;
  hasPremium: boolean;
  hasElite: boolean;
  rewardsClaimed: number[];
  premiumClaimed: number[];
  eliteClaimed: number[];
  createdAt: string;
  updatedAt: string;
}

export interface PoolPassState {
  season: SeasonPass | null;
  progress: PlayerSeasonProgress | null;
  isLoading: boolean;
  error: string | null;
}

export interface RankInfo {
  rank: number;
  pointsRequired: number;
  freeReward: SeasonReward | null;
  premiumReward: SeasonReward | null;
  eliteReward: SeasonReward | null;
  isFreeClaimed: boolean;
  isPremiumClaimed: boolean;
  isEliteClaimed: boolean;
  isUnlocked: boolean;
  progressPercent?: number;
}

export type PassType = 'premium' | 'elite';

export interface PurchaseOption {
  type: PassType;
  name: string;
  price: number;
  currency: 'EUR' | 'USD';
  features: string[];
  badge: string;
  color: string;
}

export interface MatchPPRewards {
  mode: '1v1' | 'tournament' | '9ball' | '8ball' | 'brazilian';
  result: 'win' | 'loss';
  basePP: number;
  eliteMultiplier: number;
  totalPP: number;
}

export const POINTS_PER_RANK = 100; // Pool points necessários para subir de rank
export const MAX_RANK = 50;
export const ELITE_MULTIPLIER = 3;
export const ELITE_INITIAL_BONUS = 2000;
export const PREMIUM_PRICE_EUR = 4.99;
export const ELITE_PRICE_EUR = 9.99;

export const MATCH_PP_REWARDS: Record<string, number> = {
  '1v1_win': 10,
  '1v1_loss': 2,
  tournament_win: 20,
  tournament_loss: 5,
  '9ball_win': 15,
  '9ball_loss': 3,
  '8ball_win': 10,
  '8ball_loss': 2,
  brazilian_win: 10,
  brazilian_loss: 2,
};

export function calculatePointsForRank(rank: number): number {
  return rank * POINTS_PER_RANK;
}

export function calculateRankFromPoints(points: number): number {
  const rank = Math.floor(points / POINTS_PER_RANK) + 1;
  return Math.min(rank, MAX_RANK);
}

export function getPointsForNextRank(currentRank: number, currentPoints: number): number {
  if (currentRank >= MAX_RANK) return 0;
  const pointsNeeded = calculatePointsForRank(currentRank);
  return Math.max(0, pointsNeeded - (currentPoints % POINTS_PER_RANK));
}

export function calculateRankProgress(currentPoints: number): { rank: number; progress: number } {
  const rank = calculateRankFromPoints(currentPoints);
  const pointsInCurrentRank = currentPoints % POINTS_PER_RANK;
  const progress = Math.min(100, Math.round((pointsInCurrentRank / POINTS_PER_RANK) * 100));
  return { rank, progress };
}
