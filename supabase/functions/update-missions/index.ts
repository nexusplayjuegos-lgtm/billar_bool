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

interface UpdateBody {
  action: 'progress' | 'claim';
  scope: 'daily' | 'weekly';
  missionId: string;
  amount?: number;
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

  const body = await req.json() as UpdateBody;
  const { action, scope, missionId, amount = 1 } = body;

  if (!action || !scope || !missionId) {
    return json({ error: 'Dados inválidos.' }, 400);
  }

  const today = new Date().toISOString().split('T')[0];
  const day = new Date().getDay();
  const diff = new Date().getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

  const dateFilter = scope === 'daily' ? today : weekStart;
  const table = scope === 'daily' ? 'daily_missions' : 'weekly_challenges';
  const column = scope === 'daily' ? 'date' : 'week_start';
  const missionsColumn = scope === 'daily' ? 'missions' : 'challenges';

  // Buscar registro atual
  const { data: record, error: fetchError } = await serviceClient
    .from(table)
    .select('*')
    .eq('profile_id', user.id)
    .eq(column, dateFilter)
    .single();

  if (fetchError || !record) {
    return json({ error: 'Missões não encontradas.' }, 404);
  }

  const missions = record[missionsColumn] || [];
  const mission = missions.find((m: { id: string }) => m.id === missionId);

  if (!mission) {
    return json({ error: 'Missão não encontrada.' }, 404);
  }

  if (action === 'progress') {
    if (mission.completed) {
      return json({ error: 'Missão já completada.' }, 409);
    }

    mission.current = Math.min(mission.target, mission.current + amount);
    if (mission.current >= mission.target) {
      mission.completed = true;
    }

    const allCompleted = missions.every((m: { completed: boolean }) => m.completed);

    const { error: updateError } = await serviceClient
      .from(table)
      .update({
        [missionsColumn]: missions,
        all_completed: allCompleted,
      })
      .eq('id', record.id);

    if (updateError) {
      console.error('[update-missions] Erro ao atualizar:', updateError);
      return json({ error: 'Erro ao atualizar progresso.' }, 500);
    }

    return json({ success: true, mission, allCompleted }, 200);
  }

  if (action === 'claim') {
    if (!mission.completed) {
      return json({ error: 'Missão não completada.' }, 403);
    }
    if (mission.claimed) {
      return json({ error: 'Recompensa já coletada.' }, 409);
    }

    mission.claimed = true;

    const allClaimed = missions.every((m: { claimed: boolean }) => m.claimed);

    // Aplicar recompensa
    const reward = mission.reward;
    if (reward) {
      const { data: profile } = await serviceClient.from('profiles').select('coins, cash, xp, level, xp_to_next').eq('id', user.id).single();
      if (profile) {
        const updates: Record<string, unknown> = {};
        if (reward.type === 'coins') updates.coins = (profile.coins || 0) + reward.amount;
        if (reward.type === 'cash') updates.cash = (profile.cash || 0) + reward.amount;
        if (reward.type === 'xp') {
          let newXP = (profile.xp || 0) + reward.amount;
          let newLevel = profile.level || 1;
          let newXPToNext = profile.xp_to_next || 1000;
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
    }

    const { error: updateError } = await serviceClient
      .from(table)
      .update({
        [missionsColumn]: missions,
        all_claimed: allClaimed,
      })
      .eq('id', record.id);

    if (updateError) {
      console.error('[update-missions] Erro ao reivindicar:', updateError);
      return json({ error: 'Erro ao reivindicar recompensa.' }, 500);
    }

    return json({ success: true, mission, reward, allClaimed }, 200);
  }

  return json({ error: 'Ação inválida.' }, 400);
});
