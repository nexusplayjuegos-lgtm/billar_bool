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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Buscar itens ativos
  const { data: items, error } = await client
    .from('shop_items')
    .select('*')
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
