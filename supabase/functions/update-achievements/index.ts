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

interface UpdateAchievementBody {
  action?: 'progress' | 'claim';
  profile_id?: string;
  achievement_code?: string;
  achievementCode?: string;
  increment?: number;
  value?: number;
  mode?: 'increment' | 'max';
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

function withProgress(achievement: AchievementRow, progress: ProgressRow) {
  return {
    ...achievement,
    progress,
  };
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

  const body = await req.json() as UpdateAchievementBody;
  const action = body.action ?? 'progress';
  const achievementCode = body.achievement_code ?? body.achievementCode;

  if (!achievementCode) {
    return json({ error: 'Conquista invalida.' }, 400);
  }

  if (body.profile_id && body.profile_id !== user.id) {
    return json({ error: 'Perfil nao autorizado.' }, 403);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: achievementData, error: achievementError } = await serviceClient
    .from('achievements')
    .select('*')
    .eq('code', achievementCode)
    .single();

  if (achievementError || !achievementData) {
    console.error('[update-achievements] Achievement error:', achievementError);
    return json({ error: 'Conquista nao encontrada.' }, 404);
  }

  const achievement = achievementData as AchievementRow;

  let { data: progressData, error: progressError } = await serviceClient
    .from('player_achievements')
    .select('*')
    .eq('profile_id', user.id)
    .eq('achievement_id', achievement.id)
    .single();

  if (progressError && progressError.code === 'PGRST116') {
    const { data: insertedProgress, error: insertError } = await serviceClient
      .from('player_achievements')
      .insert({
        profile_id: user.id,
        achievement_id: achievement.id,
        current_value: 0,
        completed: false,
        claimed: false,
      })
      .select('*')
      .single();

    if (insertError || !insertedProgress) {
      console.error('[update-achievements] Insert progress error:', insertError);
      return json({ error: 'Erro ao criar progresso.' }, 500);
    }

    progressData = insertedProgress;
  } else if (progressError) {
    console.error('[update-achievements] Progress error:', progressError);
    return json({ error: 'Erro ao buscar progresso.' }, 500);
  }

  const progress = progressData as ProgressRow;

  if (action === 'claim') {
    if (!progress.completed) {
      return json({ error: 'Conquista ainda nao completada.' }, 403);
    }
    if (progress.claimed) {
      return json({ error: 'Recompensa ja coletada.' }, 409);
    }

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('coins, cash, xp, level, xp_to_next')
      .eq('id', user.id)
      .single();

    if (profile) {
      const profileRecord = profile as { coins?: number; cash?: number; xp?: number; level?: number; xp_to_next?: number };
      const updates: Record<string, unknown> = {};
      if (achievement.reward_coins > 0) updates.coins = (profileRecord.coins ?? 0) + achievement.reward_coins;
      if (achievement.reward_cash > 0) updates.cash = (profileRecord.cash ?? 0) + achievement.reward_cash;
      if (achievement.reward_xp > 0) {
        let newXP = (profileRecord.xp ?? 0) + achievement.reward_xp;
        let newLevel = profileRecord.level ?? 1;
        let newXPToNext = profileRecord.xp_to_next ?? 1000;
        while (newXP >= newXPToNext) {
          newXP -= newXPToNext;
          newLevel += 1;
          newXPToNext = newLevel * 1000;
        }
        updates.xp = newXP;
        updates.level = newLevel;
        updates.xp_to_next = newXPToNext;
      }

      if (Object.keys(updates).length > 0) {
        await serviceClient.from('profiles').update(updates).eq('id', user.id);
      }
    }

    const { data: claimedProgress, error: claimError } = await serviceClient
      .from('player_achievements')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('profile_id', user.id)
      .eq('achievement_id', achievement.id)
      .select('*')
      .single();

    if (claimError || !claimedProgress) {
      console.error('[update-achievements] Claim error:', claimError);
      return json({ error: 'Erro ao coletar conquista.' }, 500);
    }

    return json({
      success: true,
      updated: true,
      completed: false,
      claimed: true,
      reward: {
        coins: achievement.reward_coins,
        cash: achievement.reward_cash,
        xp: achievement.reward_xp,
      },
      achievement: withProgress(achievement, claimedProgress as ProgressRow),
    }, 200);
  }

  if (progress.completed) {
    return json({
      success: true,
      updated: false,
      completed: false,
      achievement: withProgress(achievement, progress),
    }, 200);
  }

  const increment = Math.max(0, Number(body.increment ?? 1));
  const nextValue = body.mode === 'max' && typeof body.value === 'number'
    ? Math.max(progress.current_value, body.value)
    : progress.current_value + increment;
  const cappedValue = Math.min(achievement.target_value, nextValue);
  const justCompleted = cappedValue >= achievement.target_value && !progress.completed;

  const { data: updatedProgress, error: updateError } = await serviceClient
    .from('player_achievements')
    .update({
      current_value: cappedValue,
      completed: justCompleted ? true : progress.completed,
      completed_at: justCompleted ? new Date().toISOString() : progress.completed_at,
    })
    .eq('profile_id', user.id)
    .eq('achievement_id', achievement.id)
    .select('*')
    .single();

  if (updateError || !updatedProgress) {
    console.error('[update-achievements] Update error:', updateError);
    return json({ error: 'Erro ao atualizar conquista.' }, 500);
  }

  return json({
    success: true,
    updated: true,
    completed: justCompleted,
    achievement: withProgress(achievement, updatedProgress as ProgressRow),
  }, 200);
});
