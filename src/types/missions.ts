// ============================================================
// Tipos do Sistema de Missões
// Bool Sinuca Premiere
// ============================================================

export type MissionType =
  | 'win_games'
  | 'win_streak'
  | 'play_games'
  | 'pocket_balls'
  | 'use_power'
  | 'win_without_foul'
  | 'open_boxes'
  | 'buy_shop_item'
  | 'play_mode'
  | 'earn_coins';

export type MissionRewardType = 'coins' | 'cash' | 'xp' | 'box' | 'cue_fragment';

export interface MissionReward {
  type: MissionRewardType;
  amount: number;
}

export interface DailyMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  reward: MissionReward;
  icon: string;
}

export interface WeeklyChallenge {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  reward: MissionReward;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyMissionsRow {
  id: string;
  profileId: string;
  date: string;
  missions: DailyMission[];
  allCompleted: boolean;
  allClaimed: boolean;
  streakDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyChallengesRow {
  id: string;
  profileId: string;
  weekStart: string;
  challenges: WeeklyChallenge[];
  allCompleted: boolean;
  allClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MissionProgress {
  daily: DailyMissionsRow | null;
  weekly: WeeklyChallengesRow | null;
  isLoading: boolean;
  error: string | null;
}

// Templates de missões diárias
export const DAILY_MISSION_TEMPLATES: Omit<DailyMission, 'id' | 'current' | 'completed' | 'claimed'>[] = [
  {
    type: 'win_games',
    title: 'Vitórias do Dia',
    description: 'Vença 3 partidas',
    target: 3,
    reward: { type: 'coins', amount: 200 },
    icon: '🏆',
  },
  {
    type: 'play_games',
    title: 'Jogador Assíduo',
    description: 'Jogue 5 partidas',
    target: 5,
    reward: { type: 'coins', amount: 150 },
    icon: '🎱',
  },
  {
    type: 'pocket_balls',
    title: 'Mestre das Caçapas',
    description: 'Encaçape 10 bolas',
    target: 10,
    reward: { type: 'xp', amount: 100 },
    icon: '🎯',
  },
  {
    type: 'use_power',
    title: 'Força Bruta',
    description: 'Use potência máxima 5 vezes',
    target: 5,
    reward: { type: 'coins', amount: 100 },
    icon: '💪',
  },
  {
    type: 'win_without_foul',
    title: 'Jogo Limpo',
    description: 'Vença sem cometer faltas',
    target: 1,
    reward: { type: 'cash', amount: 5 },
    icon: '✨',
  },
];

// Templates de desafios semanais
export const WEEKLY_CHALLENGE_TEMPLATES: Omit<WeeklyChallenge, 'id' | 'current' | 'completed' | 'claimed'>[] = [
  {
    type: 'win_games',
    title: 'Campeão da Semana',
    description: 'Vença 15 partidas',
    target: 15,
    reward: { type: 'coins', amount: 1000 },
    icon: '👑',
    difficulty: 'medium',
  },
  {
    type: 'win_streak',
    title: 'Sequência Impressionante',
    description: 'Vença 5 partidas seguidas',
    target: 5,
    reward: { type: 'cash', amount: 20 },
    icon: '🔥',
    difficulty: 'hard',
  },
  {
    type: 'earn_coins',
    title: 'Colecionador',
    description: 'Ganhe 5000 moedas no total',
    target: 5000,
    reward: { type: 'box', amount: 1 },
    icon: '💰',
    difficulty: 'medium',
  },
  {
    type: 'open_boxes',
    title: 'Caçador de Tesouros',
    description: 'Abra 3 Victory Boxes',
    target: 3,
    reward: { type: 'coins', amount: 500 },
    icon: '📦',
    difficulty: 'easy',
  },
  {
    type: 'play_mode',
    title: 'Explorador de Modos',
    description: 'Jogue em 3 modos diferentes',
    target: 3,
    reward: { type: 'xp', amount: 300 },
    icon: '🗺️',
    difficulty: 'easy',
  },
  {
    type: 'buy_shop_item',
    title: 'Comprador',
    description: 'Compre 2 itens na loja',
    target: 2,
    reward: { type: 'coins', amount: 300 },
    icon: '🛒',
    difficulty: 'easy',
  },
];

export function generateDailyMissions(): DailyMission[] {
  const shuffled = [...DAILY_MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  return selected.map((template, index) => ({
    ...template,
    id: `daily_${index}_${Date.now()}`,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export function generateWeeklyChallenges(): WeeklyChallenge[] {
  const shuffled = [...WEEKLY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);

  return selected.map((template, index) => ({
    ...template,
    id: `weekly_${index}_${Date.now()}`,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1).toISOString().split('T')[0];
  const d2 = new Date(date2).toISOString().split('T')[0];
  return d1 === d2;
}

export function isSameWeek(date1: string | Date, date2: string | Date): boolean {
  const ws1 = getWeekStart(new Date(date1)).toISOString().split('T')[0];
  const ws2 = getWeekStart(new Date(date2)).toISOString().split('T')[0];
  return ws1 === ws2;
}
