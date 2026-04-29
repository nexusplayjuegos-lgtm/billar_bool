import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BallState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  inPocket: boolean;
  rotation: number;
}

interface ShotBody {
  room_id: string;
  balls_state: BallState[];
  aim_angle: number;
  power: number;
  spin_x: number;
  spin_y: number;
  shot_number: number;
}

interface RoomRow {
  player_1_id: string;
  player_2_id: string | null;
  status: string;
  current_turn: string | null;
}

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
  if (!authHeader) return json({ valid: false, reason: 'Não autenticado.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ valid: false, reason: 'Não autenticado.' }, 401);

  const body = await req.json() as ShotBody;
  const { room_id, balls_state, aim_angle, power, spin_x, spin_y, shot_number } = body;

  // ── Validar power ─────────────────────────────────────────────
  if (typeof power !== 'number' || power < 0 || power > 100) {
    return json({ valid: false, reason: 'Power inválido (0–100).' }, 400);
  }

  // ── Validar aim_angle ─────────────────────────────────────────
  if (typeof aim_angle !== 'number' || aim_angle < -Math.PI || aim_angle > Math.PI) {
    return json({ valid: false, reason: 'Ângulo inválido (-π a π).' }, 400);
  }

  // ── Validar balls_state ───────────────────────────────────────
  if (!Array.isArray(balls_state) || balls_state.length === 0 || balls_state.length > 16) {
    return json({ valid: false, reason: 'Estado das bolas inválido (máx. 16).' }, 400);
  }

  const seenIds = new Set<number>();
  for (const ball of balls_state) {
    if (typeof ball.id !== 'number' || ball.id < 0 || ball.id > 15 || !Number.isInteger(ball.id)) {
      return json({ valid: false, reason: `ID de bola inválido: ${ball.id}.` }, 400);
    }
    if (seenIds.has(ball.id)) {
      return json({ valid: false, reason: `ID de bola duplicado: ${ball.id}.` }, 400);
    }
    seenIds.add(ball.id);

    if (typeof ball.x !== 'number' || ball.x < 18 || ball.x > 782) {
      return json({ valid: false, reason: `Bola ${ball.id} fora dos limites (x).` }, 400);
    }
    if (typeof ball.y !== 'number' || ball.y < 18 || ball.y > 382) {
      return json({ valid: false, reason: `Bola ${ball.id} fora dos limites (y).` }, 400);
    }
  }

  // ── Verificar sala e turno ────────────────────────────────────
  const { data: room, error: roomError } = await userClient
    .from('rooms')
    .select('player_1_id, player_2_id, status, current_turn')
    .eq('id', room_id)
    .single<RoomRow>();

  if (roomError || !room) return json({ valid: false, reason: 'Sala não encontrada.' }, 400);
  if (room.status !== 'playing') return json({ valid: false, reason: 'Jogo não está em curso.' }, 400);

  const isPlayer = room.player_1_id === user.id || room.player_2_id === user.id;
  if (!isPlayer) return json({ valid: false, reason: 'Não pertences a esta sala.' }, 403);

  if (room.current_turn !== user.id) {
    return json({ valid: false, reason: 'Não é a tua vez.' }, 403);
  }

  // ── Inserir jogada (service role bypassa RLS) ─────────────────
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { error: insertError } = await serviceClient.from('room_shots').insert({
    room_id,
    player_id: user.id,
    balls_state,
    aim_angle,
    power,
    spin_x: spin_x ?? 0,
    spin_y: spin_y ?? 0,
    shot_number,
  });

  if (insertError) {
    return json({ valid: false, reason: `Erro ao gravar jogada: ${insertError.message}` }, 500);
  }

  const nextPlayerId = room.player_1_id === user.id ? room.player_2_id : room.player_1_id;
  if (!nextPlayerId) {
    return json({ valid: false, reason: 'Oponente nÃ£o encontrado.' }, 400);
  }

  const { error: turnError } = await serviceClient
    .from('rooms')
    .update({ current_turn: nextPlayerId })
    .eq('id', room_id);

  if (turnError) {
    return json({ valid: false, reason: `Erro ao passar turno: ${turnError.message}` }, 500);
  }

  return json({ valid: true });
});
