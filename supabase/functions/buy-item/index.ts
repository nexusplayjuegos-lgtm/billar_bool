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

interface BuyBody {
  item_id: string;
  deal_id?: string | null;
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

  const body = await req.json() as BuyBody;
  const { item_id, deal_id } = body;

  if (!item_id) return json({ error: 'ID do item inválido.' }, 400);

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Buscar item
  const { data: item, error: itemError } = await serviceClient
    .from('shop_items')
    .select('*')
    .eq('id', item_id)
    .single();

  if (itemError || !item) return json({ error: 'Item não encontrado.' }, 404);
  if (!item.is_active) return json({ error: 'Item não está disponível.' }, 400);

  // Verificar se já possui
  const { data: existing } = await serviceClient
    .from('player_inventory')
    .select('id')
    .eq('profile_id', user.id)
    .eq('item_id', item_id)
    .single();

  if (existing) return json({ error: 'Item já adquirido.' }, 409);

  // Calcular preço (com desconto se houver flash deal)
  let finalPriceCoins = item.price_coins || 0;
  let finalPriceCash = item.price_cash || 0;

  if (deal_id) {
    const { data: deal } = await serviceClient
      .from('flash_deals')
      .select('*')
      .eq('id', deal_id)
      .eq('item_id', item_id)
      .eq('is_active', true)
      .lte('start_at', new Date().toISOString())
      .gte('end_at', new Date().toISOString())
      .single();

    if (deal) {
      const discount = deal.discount_percent / 100;
      finalPriceCoins = Math.ceil(finalPriceCoins * (1 - discount));
      finalPriceCash = Math.ceil(finalPriceCash * (1 - discount));

      // Atualizar contador de compras do deal
      if (deal.max_purchases && deal.purchases_count >= deal.max_purchases) {
        return json({ error: 'Oferta esgotada.' }, 409);
      }
      await serviceClient
        .from('flash_deals')
        .update({ purchases_count: (deal.purchases_count || 0) + 1 })
        .eq('id', deal_id);
    }
  }

  // Verificar saldo
  const { data: profile } = await serviceClient.from('profiles').select('coins, cash').eq('id', user.id).single();
  if (!profile) return json({ error: 'Perfil não encontrado.' }, 404);

  if ((profile.coins ?? 0) < finalPriceCoins) {
    return json({ error: 'Moedas insuficientes.' }, 403);
  }
  if ((profile.cash ?? 0) < finalPriceCash) {
    return json({ error: 'Cash insuficiente.' }, 403);
  }

  // Descontar e inserir no inventário
  const { error: buyError } = await serviceClient.from('player_inventory').insert({
    profile_id: user.id,
    item_id: item_id,
    equipped: false,
  });

  if (buyError) {
    console.error('[buy-item] Erro ao comprar:', buyError);
    return json({ error: 'Erro ao processar compra.' }, 500);
  }

  // Atualizar saldo
  await serviceClient
    .from('profiles')
    .update({
      coins: (profile.coins ?? 0) - finalPriceCoins,
      cash: (profile.cash ?? 0) - finalPriceCash,
    })
    .eq('id', user.id);

  // Atualizar quantity_sold se houver limite
  if (item.quantity_limit) {
    await serviceClient
      .from('shop_items')
      .update({ quantity_sold: (item.quantity_sold || 0) + 1 })
      .eq('id', item_id);
  }

  return json({
    success: true,
    item,
    newCoins: (profile.coins ?? 0) - finalPriceCoins,
    newCash: (profile.cash ?? 0) - finalPriceCash,
  }, 200);
});
