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

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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
