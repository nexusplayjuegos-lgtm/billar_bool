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

  // Final fallback to legacy env vars
  if (!anonKey) anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!serviceKey) serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  return { url, anonKey, serviceKey };
}

interface ClaimBody {
  season_id: string;
  rank: number;
  reward_type: 'free' | 'premium' | 'elite';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401);

  const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey: supabaseServiceKey } = getSupabaseKeys();


  if (!supabaseAnonKey) {
    return json({ error: 'Missing Supabase configuration: no publishable keys found' }, 500);
  }
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Não autenticado.' }, 401);

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json() as ClaimBody;
  const { season_id, rank, reward_type } = body;

  if (!season_id || typeof rank !== 'number' || rank < 1 || rank > 50) {
    return json({ error: 'Dados inválidos.' }, 400);
  }
  if (!['free', 'premium', 'elite'].includes(reward_type)) {
    return json({ error: 'Tipo de recompensa inválido.' }, 400);
  }

  // Buscar season
  const { data: season, error: seasonError } = await userClient.from('season_passes').select('*').eq('id', season_id).single();
  if (seasonError || !season) {
    return json({ error: 'Season não encontrada.' }, 404);
  }

  // Buscar ou criar progresso
  let { data: progress, error: progressError } = await userClient
    .from('player_season_progress')
    .select('*')
    .eq('profile_id', user.id)
    .eq('season_id', season_id)
    .single();

  if (progressError && progressError.code === 'PGRST116') {
    // Progresso não existe, criar automaticamente
    const { data: newProgress, error: insertError } = await serviceClient
      .from('player_season_progress')
      .insert({
        profile_id: user.id,
        season_id: season_id,
        current_rank: 1,
        pool_points: 0,
        has_premium: false,
        has_elite: false,
        rewards_claimed: [],
        premium_claimed: [],
        elite_claimed: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[claim-reward] Erro ao criar progresso:', insertError);
      return json({ error: 'Erro ao criar progresso da season.' }, 500);
    }
    progress = newProgress;
  } else if (progressError) {
    console.error('[claim-reward] Erro ao buscar progresso:', progressError);
    return json({ error: 'Erro ao buscar progresso.' }, 500);
  }

  if (!progress) {
    return json({ error: 'Progresso não encontrado.' }, 404);
  }

  // Verificar se o jogador tem acesso ao tipo de recompensa
  if (reward_type === 'premium' && !progress.has_premium) {
    return json({ error: 'Premium não adquirido.' }, 403);
  }
  if (reward_type === 'elite' && !progress.has_elite) {
    return json({ error: 'Elite não adquirido.' }, 403);
  }

  // Verificar se o rank está desbloqueado
  const pointsPerRank = 100;
  const pointsNeeded = (rank - 1) * pointsPerRank;
  if (progress.pool_points < pointsNeeded) {
    return json({ error: 'Rank ainda não desbloqueado.' }, 403);
  }

  // Verificar se já foi coletado
  const claimedArray = reward_type === 'free'
    ? progress.rewards_claimed
    : reward_type === 'premium'
      ? progress.premium_claimed
      : progress.elite_claimed;

  if (claimedArray.includes(rank)) {
    return json({ error: 'Recompensa já coletada.' }, 409);
  }

  // Determinar a recompensa
  const rewardsArray = reward_type === 'free'
    ? season.free_rewards
    : reward_type === 'premium'
      ? season.premium_rewards
      : season.elite_rewards;

  const reward = rewardsArray[rank - 1];
  if (!reward) {
    return json({ error: 'Recompensa não encontrada para este rank.' }, 404);
  }

  // Atualizar progresso (marcar como coletado)
  const newClaimed = [...claimedArray, rank];

  const updateField = reward_type === 'free'
    ? 'rewards_claimed'
    : reward_type === 'premium'
      ? 'premium_claimed'
      : 'elite_claimed';

  const { error: updateError } = await serviceClient
    .from('player_season_progress')
    .update({ [updateField]: newClaimed })
    .eq('profile_id', user.id)
    .eq('season_id', season_id);

  if (updateError) {
    console.error('[claim-reward] Erro ao atualizar progresso:', updateError);
    return json({ error: 'Erro ao coletar recompensa.' }, 500);
  }

  // Aplicar recompensa ao perfil do jogador
  switch (reward.type) {
    case 'coins': {
      const { data: profile } = await serviceClient.from('profiles').select('coins').eq('id', user.id).single();
      const newCoins = (profile?.coins ?? 0) + (reward.amount || 0);
      await serviceClient.from('profiles').update({ coins: newCoins }).eq('id', user.id);
      break;
    }
    case 'cash': {
      const { data: profile } = await serviceClient.from('profiles').select('cash').eq('id', user.id).single();
      const newCash = (profile?.cash ?? 0) + (reward.amount || 0);
      await serviceClient.from('profiles').update({ cash: newCash }).eq('id', user.id);
      break;
    }
    case 'xp': {
      const { data: profile } = await serviceClient.from('profiles').select('xp, level, xp_to_next').eq('id', user.id).single();
      if (profile) {
        let newXP = (profile.xp || 0) + (reward.amount || 0);
        let newLevel = profile.level || 1;
        let newXPToNext = profile.xp_to_next || 1000;
        while (newXP >= newXPToNext) {
          newXP -= newXPToNext;
          newLevel += 1;
          newXPToNext = newLevel * 1000;
        }
        await serviceClient.from('profiles').update({ xp: newXP, level: newLevel, xp_to_next: newXPToNext }).eq('id', user.id);
      }
      break;
    }
    case 'cue':
      if (reward.itemId) {
        const { data: profile } = await serviceClient.from('profiles').select('owned_cues').eq('id', user.id).single();
        const currentCues = profile?.owned_cues || [];
        if (!currentCues.includes(reward.itemId)) {
          await serviceClient.from('profiles').update({ owned_cues: [...currentCues, reward.itemId] }).eq('id', user.id);
        }
      }
      break;
    case 'table':
      if (reward.itemId) {
        const { data: profile } = await serviceClient.from('profiles').select('owned_tables').eq('id', user.id).single();
        const currentTables = profile?.owned_tables || [];
        if (!currentTables.includes(reward.itemId)) {
          await serviceClient.from('profiles').update({ owned_tables: [...currentTables, reward.itemId] }).eq('id', user.id);
        }
      }
      break;
    default:
      // Para outros tipos (avatar, title, emote, box, spin), armazenar em inventory se necessário
      break;
  }

  return json({
    success: true,
    reward,
    rank,
    rewardType: reward_type,
  }, 200);
});
