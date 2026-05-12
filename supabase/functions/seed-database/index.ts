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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  const { url: supabaseUrl, serviceKey: serviceRoleKey } = getSupabaseKeys();

  // Strict security: only service_role key is accepted
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return json({ error: 'Unauthorized. Service role key required.' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: {
    shop_items: number;
    season_passes: number;
    errors: string[];
  } = {
    shop_items: 0,
    season_passes: 0,
    errors: [],
  };

  try {
    // Seed shop_items
    const { error: shopError } = await supabase.rpc('seed_shop_items');
    if (shopError) {
      results.errors.push(`seed_shop_items: ${shopError.message}`);
    } else {
      const { count, error: countError } = await supabase
        .from('shop_items')
        .select('*', { count: 'exact', head: true });
      if (countError) results.errors.push(`shop_items count: ${countError.message}`);
      else results.shop_items = count ?? 0;
    }

    // Seed season_passes
    const { error: seasonError } = await supabase.rpc('seed_season_pass');
    if (seasonError) {
      results.errors.push(`seed_season_pass: ${seasonError.message}`);
    } else {
      const { count, error: countError } = await supabase
        .from('season_passes')
        .select('*', { count: 'exact', head: true });
      if (countError) results.errors.push(`season_passes count: ${countError.message}`);
      else results.season_passes = count ?? 0;
    }

    return json({ success: true, results }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
