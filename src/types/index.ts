// Tipos globais BOOL SINUCA PREMIERE

export interface User {
  id: string;
  username: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  rank: string;
  stats: UserStats;
  currencies: Currencies;
  equipment: Equipment;
  inventory: Inventory;
  social: Social;
  settings: Settings;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  maxWinStreak: number;
  bestBreak: number;
  totalCoinsWon: number;
  country: string;
}

export interface Currencies {
  coins: number;
  cash: number;
}

export interface Equipment {
  currentCue: string;
  ownedCues: string[];
  currentTable: string;
  ownedTables: string[];
}

export interface Inventory {
  spins: number;
  scratchCards: number;
  boosters: {
    xp2x: number;
    coin2x: number;
  };
}

export interface Social {
  friends: number;
  club: string | null;
  globalRank: number;
}

export interface Settings {
  language: 'en' | 'es' | 'pt';
  sound: boolean;
  music: boolean;
  vibration: boolean;
  notifications: boolean;
}

export interface Cue {
  id: string;
  nameKey: string;
  descriptionKey: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats: CueStats;
  price: Price;
  visual: string;
  effects: string[];
  unlocked: boolean;
  acquiredAt?: string;
  levelRequired?: number;
}

export interface CueStats {
  power: number;
  aim: number;
  spin: number;
  time: number;
}

export interface Price {
  coins: number;
  cash: number;
}

export interface GameMode {
  id: string;
  nameKey: string;
  subtitleKey: string;
  descriptionKey: string;
  type: '8ball' | 'brazilian' | 'snooker';
  minLevel: number;
  entryFee: Price;
  reward: {
    win: number;
    loss: number;
  };
  timePerShot: number;
  rules: string;
  table: string;
  botDifficulty: number;
  icon: string;
  color: string;
  glow?: boolean;
  featured?: boolean;
  lockedMessageKey?: string;
  specialBalls?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  country: string;
  coins: number;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Leaderboard {
  global: LeaderboardEntry[];
  friends: LeaderboardEntry[];
  userPosition: {
    global: number;
    country: number;
    friends: number;
  };
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number?: number;
  isStriped?: boolean;
  inPocket: boolean;
}

export interface GameState {
  balls: Ball[];
  currentPlayer: number;
  player1Type: 'solid' | 'stripe' | null;
  player2Type: 'solid' | 'stripe' | null;
  turn: number;
  gameOver: boolean;
  winner: number | null;
  foul: boolean;
  scratch: boolean;
  shots: number;
}
