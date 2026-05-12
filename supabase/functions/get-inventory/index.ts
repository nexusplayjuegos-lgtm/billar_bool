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
function getSupabaseKeys(): { url: string; anonKey: string } {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const publishableKeysRaw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');

  let anonKey = '';

  try {
    if (publishableKeysRaw) {
      const keys = JSON.parse(publishableKeysRaw) as Record<string, string>;
      anonKey = keys.anon || Object.values(keys)[0] || '';
    }
  } catch {
    // Fallback to legacy env var
  }

  if (!anonKey) anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  return { url, anonKey };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401);

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseKeys();


  if (!supabaseAnonKey) {
    return json({ error: 'Missing Supabase configuration: no publishable keys found' }, 500);
  }
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Não autenticado.' }, 401);

  const { data: inventory, error } = await userClient
    .from('player_inventory')
    .select('*, item:shop_items(*)')
    .eq('profile_id', user.id);

  if (error) {
    console.error('[get-inventory] Erro:', error);
    return json({ error: 'Erro ao buscar inventário.' }, 500);
  }

  return json({ inventory: inventory || [] }, 200);
});
