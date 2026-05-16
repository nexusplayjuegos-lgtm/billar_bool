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

interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  tier: number;
  target_value: number;
  reward_coins: number;
  reward_cash: number;
  reward_xp: number;
  icon_url: string | null;
  created_at: string;
}

interface ProgressRow {
  id: string;
  profile_id: string;
  achievement_id: string;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Nao autenticado.' }, 401);

  const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey: supabaseServiceKey } = getSupabaseKeys();
  if (!supabaseAnonKey || !supabaseServiceKey) {
    return json({ error: 'Missing Supabase configuration' }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Nao autenticado.' }, 401);

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: achievements, error: achievementsError } = await serviceClient
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('tier', { ascending: true });

  if (achievementsError) {
    console.error('[get-achievements] Achievements error:', achievementsError);
    return json({ error: 'Erro ao buscar conquistas.' }, 500);
  }

  const achievementRows = (achievements ?? []) as AchievementRow[];

  if (achievementRows.length === 0) {
    return json({ achievements: [] }, 200);
  }

  const { data: existingProgress, error: progressError } = await serviceClient
    .from('player_achievements')
    .select('*')
    .eq('profile_id', user.id);

  if (progressError) {
    console.error('[get-achievements] Progress error:', progressError);
    return json({ error: 'Erro ao buscar progresso das conquistas.' }, 500);
  }

  const progressRows = (existingProgress ?? []) as ProgressRow[];
  const existingAchievementIds = new Set(progressRows.map((progress) => progress.achievement_id));
  const missingRows = achievementRows
    .filter((achievement) => !existingAchievementIds.has(achievement.id))
    .map((achievement) => ({
      profile_id: user.id,
      achievement_id: achievement.id,
      current_value: 0,
      completed: false,
      claimed: false,
    }));

  let allProgress = progressRows;

  if (missingRows.length > 0) {
    const { data: insertedProgress, error: insertError } = await serviceClient
      .from('player_achievements')
      .insert(missingRows)
      .select('*');

    if (insertError) {
      console.error('[get-achievements] Insert error:', insertError);
      return json({ error: 'Erro ao criar progresso das conquistas.' }, 500);
    }

    allProgress = [...progressRows, ...((insertedProgress ?? []) as ProgressRow[])];
  }

  const progressByAchievementId = new Map(allProgress.map((progress) => [progress.achievement_id, progress]));
  const rows = achievementRows.map((achievement) => ({
    ...achievement,
    progress: progressByAchievementId.get(achievement.id) ?? null,
  }));

  return json({ achievements: rows }, 200);
});
