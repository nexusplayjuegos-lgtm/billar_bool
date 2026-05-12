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

interface OpenBoxBody {
  box_id: string;
  accelerate?: boolean;
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

  const body = await req.json() as OpenBoxBody;
  const { box_id, accelerate } = body;

  if (!box_id) return json({ error: 'ID da box inválido.' }, 400);

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Buscar box
  const { data: box, error: boxError } = await serviceClient
    .from('victory_boxes')
    .select('*')
    .eq('id', box_id)
    .eq('profile_id', user.id)
    .single();

  if (boxError || !box) return json({ error: 'Box não encontrada.' }, 404);
  if (box.status === 'opened') return json({ error: 'Box já foi aberta.' }, 409);

  // Verificar se está pronta para abrir
  let canOpen = box.status === 'locked';

  if (box.status === 'unlocking' && box.unlock_started_at) {
    const started = new Date(box.unlock_started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    if (elapsed >= box.unlock_duration_seconds) {
      canOpen = true;
    }
  }

  // Se não pode abrir e não está acelerando, rejeita
  if (!canOpen && !accelerate) {
    return json({ error: 'Box ainda não está pronta para abrir.' }, 403);
  }

  // Se está acelerando, calcular custo e descontar cash
  if (accelerate && !canOpen) {
    const started = new Date(box.unlock_started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const remaining = Math.max(0, box.unlock_duration_seconds - elapsed);
    const cost = Math.max(1, Math.ceil(remaining / 600)); // 1 cash a cada 10 min

    const { data: profile } = await serviceClient.from('profiles').select('cash').eq('id', user.id).single();
    if (!profile || (profile.cash ?? 0) < cost) {
      return json({ error: `Cash insuficiente. Custo: ${cost} cash.` }, 403);
    }

    await serviceClient.from('profiles').update({ cash: profile.cash - cost }).eq('id', user.id);
  }

  // Iniciar unlock se estiver locked
  if (box.status === 'locked' && !canOpen) {
    const { error: updateError } = await serviceClient
      .from('victory_boxes')
      .update({
        status: 'unlocking',
        unlock_started_at: new Date().toISOString(),
      })
      .eq('id', box_id);

    if (updateError) {
      console.error('[open-box] Erro ao iniciar unlock:', updateError);
      return json({ error: 'Erro ao iniciar abertura.' }, 500);
    }

    return json({
      success: true,
      started: true,
      message: 'Desbloqueio iniciado!',
    }, 200);
  }

  // Abrir box e aplicar recompensas
  const rewards = box.rewards || [];

  for (const reward of rewards) {
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
        break;
    }
  }

  // Marcar como aberta
  const { error: finalError } = await serviceClient
    .from('victory_boxes')
    .update({
      status: 'opened',
      opened_at: new Date().toISOString(),
    })
    .eq('id', box_id);

  if (finalError) {
    console.error('[open-box] Erro ao finalizar abertura:', finalError);
    return json({ error: 'Erro ao abrir box.' }, 500);
  }

  return json({
    success: true,
    rewards,
    boxType: box.box_type,
  }, 200);
});
