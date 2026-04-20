import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
export async function fetchProfile(userId: string): Promise<Tables['profiles'] | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[fetchProfile] erro:', error.message, error.code);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[fetchProfile] excepção:', err);
    return null;
  }
}

// Tipos para autocompletar
export type Tables = {
  profiles: {
    id: string;
    username: string;
    email: string;
    level: number;
    xp: number;
    coins: number;
    cash: number;
    stats: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
      maxWinStreak: number;
      currentWinStreak: number;
      totalCoinsWon: number;
    };
    owned_cues: string[];
    current_cue: string;
    created_at: string;
  };
  matches: {
    id: string;
    player_id: string;
    mode: string;
    result: 'win' | 'loss' | 'draw';
    coins_bet: number;
    coins_won: number;
    xp_gained: number;
    created_at: string;
  };
  leaderboard: {
    user_id: string;
    username: string;
    rank_global: number;
    weekly_wins: number;
    total_wins: number;
    total_coins_won: number;
  };
};