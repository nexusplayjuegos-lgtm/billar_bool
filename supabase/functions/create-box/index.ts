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

interface CreateBoxBody {
  box_type: 'common' | 'rare' | 'epic' | 'legendary';
  has_elite: boolean;
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

  const body = await req.json() as CreateBoxBody;
  const { box_type, has_elite } = body;

  if (!box_type || !['common', 'rare', 'epic', 'legendary'].includes(box_type)) {
    return json({ error: 'Tipo de box inválido.' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Verificar slots disponíveis
  const { data: activeBoxes } = await serviceClient
    .from('victory_boxes')
    .select('id')
    .eq('profile_id', user.id)
    .neq('status', 'opened');

  const maxSlots = has_elite ? 6 : 4;
  const currentSlots = activeBoxes?.length ?? 0;

  if (currentSlots >= maxSlots) {
    // Slots cheios: converter em coins (menor valor)
    const fallbackCoins = box_type === 'legendary' ? 500 : box_type === 'epic' ? 300 : box_type === 'rare' ? 150 : 50;

    const { data: profile } = await serviceClient.from('profiles').select('coins').eq('id', user.id).single();
    const newCoins = (profile?.coins ?? 0) + fallbackCoins;
    await serviceClient.from('profiles').update({ coins: newCoins }).eq('id', user.id);

    return json({
      success: true,
      converted: true,
      fallbackCoins,
      message: 'Slots cheios! Box convertida em coins.',
    }, 200);
  }

  // Calcular duração
  const baseDurations: Record<string, number> = {
    common: 3 * 60 * 60,
    rare: 8 * 60 * 60,
    epic: 12 * 60 * 60,
    legendary: 24 * 60 * 60,
  };

  const duration = has_elite
    ? Math.floor(baseDurations[box_type] / 3)
    : baseDurations[box_type];

  // Gerar recompensas
  const { data: rewardsData } = await serviceClient.rpc('generate_box_rewards', {
    p_box_type: box_type,
  });

  // Criar box
  const { data: box, error: insertError } = await serviceClient
    .from('victory_boxes')
    .insert({
      profile_id: user.id,
      box_type,
      status: 'locked',
      unlock_duration_seconds: duration,
      rewards: rewardsData || [],
      is_elite_speed: has_elite,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[create-box] Erro ao criar box:', insertError);
    return json({ error: 'Erro ao criar box.' }, 500);
  }

  return json({
    success: true,
    box,
    converted: false,
  }, 200);
});
