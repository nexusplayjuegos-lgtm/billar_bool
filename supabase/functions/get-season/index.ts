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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Não autenticado.' }, 401);

  // Buscar season ativa
  const { data: season, error: seasonError } = await userClient
    .from('season_passes')
    .select('*')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .order('season_number', { ascending: false })
    .limit(1)
    .single();

  if (seasonError || !season) {
    return json({ season: null, progress: null }, 200);
  }

  // Buscar ou criar progresso do jogador
  let { data: progress, error: progressError } = await userClient
    .from('player_season_progress')
    .select('*')
    .eq('profile_id', user.id)
    .eq('season_id', season.id)
    .single();

  if (progressError && progressError.code === 'PGRST116') {
    // Não existe progresso, criar um novo
    const { data: newProgress, error: insertError } = await userClient
      .from('player_season_progress')
      .insert({
        profile_id: user.id,
        season_id: season.id,
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
      console.error('[get-season] Erro ao criar progresso:', insertError);
      return json({ error: 'Erro ao criar progresso da season.' }, 500);
    }
    progress = newProgress;
  } else if (progressError) {
    console.error('[get-season] Erro ao buscar progresso:', progressError);
    return json({ error: 'Erro ao buscar progresso.' }, 500);
  }

  return json({ season, progress }, 200);
});
