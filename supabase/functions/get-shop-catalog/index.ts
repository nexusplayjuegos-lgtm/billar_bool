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

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseKeys();


  if (!supabaseAnonKey) {
    return json({ error: 'Missing Supabase configuration: no publishable keys found' }, 500);
  }
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Buscar itens ativos
  const { data: items, error } = await client
    .from('shop_items')
    .select('id, category, name, description, price_coins, price_cash, rarity, stats, image_url, design_key, is_limited, available_from, available_until, quantity_limit, quantity_sold, is_active, created_at')
    .eq('is_active', true)
    .lte('available_from', new Date().toISOString())
    .or('available_until.is.null,available_until.gte.' + new Date().toISOString())
    .order('category', { ascending: true })
    .order('rarity', { ascending: false });

  if (error) {
    console.error('[get-shop-catalog] Erro:', error);
    return json({ error: 'Erro ao buscar catálogo.' }, 500);
  }

  return json({ items: items || [] }, 200);
});
