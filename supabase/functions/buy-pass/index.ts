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

interface BuyPassBody {
  season_id: string;
  pass_type: 'premium' | 'elite';
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

  const body = await req.json() as BuyPassBody;
  const { season_id, pass_type } = body;

  if (!season_id || !['premium', 'elite'].includes(pass_type)) {
    return json({ error: 'Dados inválidos.' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Buscar season e progresso
  const [{ data: season }, { data: progress }] = await Promise.all([
    serviceClient.from('season_passes').select('*').eq('id', season_id).single(),
    serviceClient.from('player_season_progress').select('*').eq('profile_id', user.id).eq('season_id', season_id).single(),
  ]);

  if (!season || !progress) {
    return json({ error: 'Season ou progresso não encontrado.' }, 404);
  }

  // Se já tem elite, não permite comprar premium (já inclui)
  if (pass_type === 'premium' && progress.has_elite) {
    return json({ error: 'Já possui Elite Pass. Premium está incluído.' }, 409);
  }

  // Se já tem o mesmo pass, rejeita
  if (pass_type === 'premium' && progress.has_premium && !progress.has_elite) {
    return json({ error: 'Premium já adquirido.' }, 409);
  }
  if (pass_type === 'elite' && progress.has_elite) {
    return json({ error: 'Elite já adquirido.' }, 409);
  }

  // Atualizar progresso com o novo pass
  const updates: Record<string, unknown> = {};
  if (pass_type === 'premium') {
    updates.has_premium = true;
  } else if (pass_type === 'elite') {
    updates.has_premium = true;
    updates.has_elite = true;
    // Elite dá 2000 PP iniciais de bônus
    updates.pool_points = (progress.pool_points || 0) + 2000;
    // Recalcular current_rank baseado nos novos pontos
    const pointsPerRank = 100;
    const newRank = Math.min(50, Math.floor((updates.pool_points as number) / pointsPerRank) + 1);
    updates.current_rank = newRank;
  }

  const { error: updateError } = await serviceClient
    .from('player_season_progress')
    .update(updates)
    .eq('id', progress.id);

  if (updateError) {
    console.error('[buy-pass] Erro ao atualizar progresso:', updateError);
    return json({ error: 'Erro ao processar compra.' }, 500);
  }

  return json({
    success: true,
    passType: pass_type,
    message: pass_type === 'elite'
      ? 'Elite Pass adquirido! +2000 Pool Points de bônus!'
      : 'Premium Pass adquirido!',
  }, 200);
});
