import { User } from '@/types';

export const MOCK_USER: User = {
  id: "usr_bool_001",
  username: "SinucaMaster",
  level: 7,
  currentXP: 1450,
  nextLevelXP: 2000,
  rank: "Bronze III",
  stats: {
    totalGames: 47,
    wins: 28,
    losses: 19,
    winRate: 59.5,
    maxWinStreak: 5,
    bestBreak: 4,
    totalCoinsWon: 45200,
    country: "BR"
  },
  currencies: {
    coins: 12500,
    cash: 45
  },
  equipment: {
    currentCue: "cue_venom_striker",
    ownedCues: ["cue_beginner", "cue_venom_striker"],
    currentTable: "table_classic_green",
    ownedTables: ["table_classic_green", "table_blue_velvet"]
  },
  inventory: {
    spins: 3,
    scratchCards: 1,
    boosters: { xp2x: 2, coin2x: 0 }
  },
  social: {
    friends: 12,
    club: "Os Bilhares",
    globalRank: 15423
  },
  settings: {
    language: "pt",
    sound: true,
    music: true,
    vibration: true,
    notifications: true
  }
};
