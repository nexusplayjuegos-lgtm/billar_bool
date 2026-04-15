import { Leaderboard } from '@/types';

export const MOCK_LEADERBOARD: Leaderboard = {
  global: [
    { rank: 1, username: "Efren Reyes", level: 147, country: "PH", coins: 999999999, avatar: "/assets/avatars/pro_1.png" },
    { rank: 2, username: "Ronnie O'Sullivan", level: 145, country: "UK", coins: 875000000, avatar: "/assets/avatars/pro_2.png" },
    { rank: 3, username: "Sinucão_BR", level: 132, country: "BR", coins: 754200000, avatar: "/assets/avatars/pro_3.png" },
    { rank: 4, username: "PoolKing_USA", level: 128, country: "US", coins: 698500000, avatar: "/assets/avatars/pro_4.png" },
    { rank: 5, username: "Shane Van Boening", level: 125, country: "US", coins: 621000000, avatar: "/assets/avatars/pro_5.png" },
    { rank: 6, username: "Fedor Gorst", level: 122, country: "RU", coins: 587300000, avatar: "/assets/avatars/pro_6.png" },
    { rank: 7, username: "Joshua Filler", level: 119, country: "DE", coins: 542100000, avatar: "/assets/avatars/pro_7.png" },
    { rank: 8, username: "Ko Pin-yi", level: 115, country: "TW", coins: 498700000, avatar: "/assets/avatars/pro_8.png" },
    { rank: 9, username: "Albin Ouschan", level: 112, country: "AT", coins: 465200000, avatar: "/assets/avatars/pro_9.png" },
    { rank: 10, username: "David Alcaide", level: 108, country: "ES", coins: 423800000, avatar: "/assets/avatars/pro_10.png" }
  ],
  friends: [
    { rank: 1, username: "João_8ball", level: 23, country: "BR", coins: 45000, avatar: "/assets/avatars/friend_1.png", isOnline: true },
    { rank: 2, username: "MariaSinuca", level: 19, country: "BR", coins: 32100, avatar: "/assets/avatars/friend_2.png", isOnline: false, lastSeen: "2h ago" },
    { rank: 3, username: "PedroTaco", level: 15, country: "BR", coins: 18500, avatar: "/assets/avatars/friend_3.png", isOnline: true },
    { rank: 4, username: "AnaBilhar", level: 12, country: "BR", coins: 12400, avatar: "/assets/avatars/friend_4.png", isOnline: false, lastSeen: "5h ago" },
    { rank: 5, username: "CarlosMesa", level: 8, country: "BR", coins: 8200, avatar: "/assets/avatars/friend_5.png", isOnline: true }
  ],
  userPosition: {
    global: 15423,
    country: 342,
    friends: 3
  }
};
