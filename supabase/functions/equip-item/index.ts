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

interface EquipBody {
  item_id: string;
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

  const body = await req.json() as EquipBody;
  const { item_id } = body;

  if (!item_id) return json({ error: 'ID do item inválido.' }, 400);

  // Verificar se possui o item
  const { data: inventoryItem, error: invError } = await userClient
    .from('player_inventory')
    .select('id')
    .eq('profile_id', user.id)
    .eq('item_id', item_id)
    .single();

  if (invError || !inventoryItem) {
    return json({ error: 'Você não possui este item.' }, 403);
  }

  // Usar função RPC para equipar (desequipa outros da mesma categoria)
  const { error: rpcError } = await userClient.rpc('equip_item', {
    p_profile_id: user.id,
    p_item_id: item_id,
  });

  if (rpcError) {
    console.error('[equip-item] Erro:', rpcError);
    return json({ error: 'Erro ao equipar item.' }, 500);
  }

  return json({ success: true }, 200);
});
