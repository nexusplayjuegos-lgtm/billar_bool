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

serve(async (_req: Request) => {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseKeys();


  if (!supabaseAnonKey) {
    return json({ error: 'Missing Supabase configuration: no publishable keys found' }, 500);
  }
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const now = new Date().toISOString();

  const { data: deals, error } = await client
    .from('flash_deals')
    .select('*, item:shop_items(*)')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)
    .order('end_at', { ascending: true });

  if (error) {
    console.error('[get-flash-deals] Erro:', error);
    return json({ error: 'Erro ao buscar ofertas.' }, 500);
  }

  return json({ deals: deals || [] }, 200);
});
