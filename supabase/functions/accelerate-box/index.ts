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

interface AccelerateBody {
  box_id: string;
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

  const body = await req.json() as AccelerateBody;
  const { box_id } = body;

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
  if (box.status !== 'unlocking' || !box.unlock_started_at) {
    return json({ error: 'Box não está em desbloqueio.' }, 400);
  }

  // Calcular custo
  const started = new Date(box.unlock_started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  const remaining = Math.max(0, box.unlock_duration_seconds - elapsed);

  if (remaining <= 0) {
    return json({ error: 'Box já está pronta para abrir.' }, 400);
  }

  const cost = Math.max(1, Math.ceil(remaining / 600)); // 1 cash a cada 10 min

  // Verificar cash
  const { data: profile } = await serviceClient.from('profiles').select('cash').eq('id', user.id).single();
  if (!profile || (profile.cash ?? 0) < cost) {
    return json({ error: `Cash insuficiente. Custo: ${cost} cash.` }, 403);
  }

  // Descontar cash
  await serviceClient.from('profiles').update({ cash: profile.cash - cost }).eq('id', user.id);

  // Completar desbloqueio imediatamente
  const { error: updateError } = await serviceClient
    .from('victory_boxes')
    .update({
      unlock_started_at: new Date(Date.now() - box.unlock_duration_seconds * 1000).toISOString(),
    })
    .eq('id', box_id);

  if (updateError) {
    console.error('[accelerate-box] Erro ao acelerar:', updateError);
    return json({ error: 'Erro ao acelerar desbloqueio.' }, 500);
  }

  return json({
    success: true,
    cost,
    message: `Desbloqueio acelerado! -${cost} cash`,
  }, 200);
});
