import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Parse Supabase keys from new JSON dictionary format or fallback to legacy
function getSupabaseKeys(): { url: string; anonKey: string; serviceKey: string } {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const publishableKeysRaw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');

  let anonKey = '';
  let serviceKey = '';

  try {
    if (publishableKeysRaw) {
      const keys = JSON.parse(publishableKeysRaw) as Record<string, string>;
      anonKey = keys.anon || Object.values(keys)[0] || '';
    }
    if (secretKeysRaw) {
      const keys = JSON.parse(secretKeysRaw) as Record<string, string>;
      serviceKey = keys.service_role || Object.values(keys)[0] || '';
    }
  } catch {
    // Fallback to legacy env vars
  }

  if (!anonKey) anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!serviceKey) serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  return { url, anonKey, serviceKey };
}

// Mission templates
const DAILY_TEMPLATES = [
  { type: 'win_games', title: 'Vitórias do Dia', description: 'Vença 3 partidas', target: 3, reward: { type: 'coins', amount: 200 }, icon: '🏆' },
  { type: 'play_games', title: 'Jogador Assíduo', description: 'Jogue 5 partidas', target: 5, reward: { type: 'coins', amount: 150 }, icon: '🎱' },
  { type: 'pocket_balls', title: 'Mestre das Caçapas', description: 'Encaçape 10 bolas', target: 10, reward: { type: 'xp', amount: 100 }, icon: '🎯' },
  { type: 'use_power', title: 'Força Bruta', description: 'Use potência máxima 5 vezes', target: 5, reward: { type: 'coins', amount: 100 }, icon: '💪' },
  { type: 'win_without_foul', title: 'Jogo Limpo', description: 'Vença sem cometer faltas', target: 1, reward: { type: 'cash', amount: 5 }, icon: '✨' },
];

const WEEKLY_TEMPLATES = [
  { type: 'win_games', title: 'Campeão da Semana', description: 'Vença 15 partidas', target: 15, reward: { type: 'coins', amount: 1000 }, icon: '👑', difficulty: 'medium' },
  { type: 'win_streak', title: 'Sequência Impressionante', description: 'Vença 5 partidas seguidas', target: 5, reward: { type: 'cash', amount: 20 }, icon: '🔥', difficulty: 'hard' },
  { type: 'earn_coins', title: 'Colecionador', description: 'Ganhe 5000 moedas no total', target: 5000, reward: { type: 'box', amount: 1 }, icon: '💰', difficulty: 'medium' },
  { type: 'open_boxes', title: 'Caçador de Tesouros', description: 'Abra 3 Victory Boxes', target: 3, reward: { type: 'coins', amount: 500 }, icon: '📦', difficulty: 'easy' },
  { type: 'play_mode', title: 'Explorador de Modos', description: 'Jogue em 3 modos diferentes', target: 3, reward: { type: 'xp', amount: 300 }, icon: '🗺️', difficulty: 'easy' },
  { type: 'buy_shop_item', title: 'Comprador', description: 'Compre 2 itens na loja', target: 2, reward: { type: 'coins', amount: 300 }, icon: '🛒', difficulty: 'easy' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMissions(templates: typeof DAILY_TEMPLATES, prefix: string, count: number) {
  const selected = shuffle(templates).slice(0, count);
  return selected.map((t, i) => ({
    ...t,
    id: `${prefix}_${i}_${Date.now()}`,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401);

  const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey: supabaseServiceKey } = getSupabaseKeys();

  if (!supabaseAnonKey) {
    return json({ error: 'Missing Supabase configuration' }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Não autenticado.' }, 401);

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart().toISOString().split('T')[0];

  // Buscar ou criar daily missions
  let { data: daily, error: dailyError } = await serviceClient
    .from('daily_missions')
    .select('*')
    .eq('profile_id', user.id)
    .eq('date', today)
    .single();

  if (dailyError && dailyError.code === 'PGRST116') {
    // Não existe, criar novas missões
    const missions = generateMissions(DAILY_TEMPLATES, 'daily', 3);
    const { data: newDaily, error: insertError } = await serviceClient
      .from('daily_missions')
      .insert({
        profile_id: user.id,
        date: today,
        missions,
        all_completed: false,
        all_claimed: false,
        streak_days: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[get-missions] Erro ao criar daily:', insertError);
      return json({ error: 'Erro ao criar missões diárias.' }, 500);
    }
    daily = newDaily;
  } else if (dailyError) {
    console.error('[get-missions] Erro ao buscar daily:', dailyError);
    return json({ error: 'Erro ao buscar missões diárias.' }, 500);
  }

  // Buscar ou criar weekly challenges
  let { data: weekly, error: weeklyError } = await serviceClient
    .from('weekly_challenges')
    .select('*')
    .eq('profile_id', user.id)
    .eq('week_start', weekStart)
    .single();

  if (weeklyError && weeklyError.code === 'PGRST116') {
    const challenges = generateMissions(WEEKLY_TEMPLATES, 'weekly', 4);
    const { data: newWeekly, error: insertError } = await serviceClient
      .from('weekly_challenges')
      .insert({
        profile_id: user.id,
        week_start: weekStart,
        challenges,
        all_completed: false,
        all_claimed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[get-missions] Erro ao criar weekly:', insertError);
      return json({ error: 'Erro ao criar desafios semanais.' }, 500);
    }
    weekly = newWeekly;
  } else if (weeklyError) {
    console.error('[get-missions] Erro ao buscar weekly:', weeklyError);
    return json({ error: 'Erro ao buscar desafios semanais.' }, 500);
  }

  return json({ daily, weekly }, 200);
});
