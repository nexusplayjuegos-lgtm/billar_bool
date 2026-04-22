// src/lib/multiplayer/client.ts

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Room, RoomShot, RoomMessage, BallState, GameMode } from './types';

interface MultiplayerClientCallbacks {
  onRoomUpdate: (room: Room) => void;
  onOpponentShot: (shot: RoomShot) => void;
  onMessage: (message: RoomMessage) => void;
  onOpponentJoined: (room: Room) => void;
  onOpponentLeft: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class MultiplayerClient {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private userId: string;
  private callbacks: MultiplayerClientCallbacks;
  private lastShotNumber = 0;
  private subscribedRoomId: string | null = null;
  private isSubscribing = false;

  constructor(userId: string, callbacks: MultiplayerClientCallbacks) {
    this.userId = userId;
    this.callbacks = callbacks;
  }

  // ── Criar sala ────────────────────────────────────────────────
  async createRoom(gameMode: GameMode = '8ball', betCoins = 0): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        player_1_id: this.userId,
        status: 'waiting',
        game_mode: gameMode,
        bet_coins: betCoins,
        current_turn: this.userId,
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar sala: ${error.message}`);

    this.roomId = data.id;
    this.subscribeToRoom(data.id);
    return data as Room;
  }

  // ── Entrar em sala existente ──────────────────────────────────
  async joinRoom(roomId: string): Promise<Room> {
    // Se já estamos subscritos a esta sala, retorna sala atual
    if (this.roomId === roomId && this.subscribedRoomId === roomId && this.channel) {
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      if (existingRoom) return existingRoom as Room;
    }

    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!existingRoom) throw new Error('Sala não encontrada.');

    if (
      existingRoom.player_1_id === this.userId ||
      existingRoom.player_2_id === this.userId
    ) {
      this.roomId = roomId;
      this.subscribeToRoom(roomId);
      return existingRoom as Room;
    }

    if (existingRoom.player_2_id && existingRoom.player_2_id !== this.userId) {
      throw new Error('Sala cheia.');
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ player_2_id: this.userId, status: 'playing' })
      .eq('id', roomId)
      .select()
      .single();

    if (error || !data) throw new Error('Erro ao entrar na sala.');

    this.roomId = roomId;
    this.subscribeToRoom(roomId);
    return data as Room;
  }

  // ── Listar salas disponíveis ──────────────────────────────────
  async listAvailableRooms(gameMode?: GameMode): Promise<Room[]> {
    let query = supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .neq('player_1_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao listar salas: ${error.message}`);
    return (data ?? []) as Room[];
  }

  // ── Enviar jogada ─────────────────────────────────────────────
  async sendShot(
    ballsState: BallState[],
    aimAngle: number,
    power: number,
    spinX = 0,
    spinY = 0,
  ): Promise<void> {
    if (!this.roomId) throw new Error('Não está numa sala.');

    this.lastShotNumber += 1;

    interface ValidateShotResponse {
      valid: boolean;
      reason?: string;
    }

    const { data, error: fnError } = await supabase.functions.invoke<ValidateShotResponse>(
      'validate-shot',
      {
        body: {
          room_id: this.roomId,
          balls_state: ballsState,
          aim_angle: aimAngle,
          power,
          spin_x: spinX,
          spin_y: spinY,
          shot_number: this.lastShotNumber,
        },
      },
    );

    if (fnError) throw new Error(`Erro ao validar jogada: ${fnError.message}`);
    if (!data?.valid) throw new Error(data?.reason ?? 'Jogada inválida.');

    // Passa o turno para o oponente
    const { error: turnError } = await supabase
      .from('rooms')
      .update({ current_turn: null })
      .eq('id', this.roomId);

    if (turnError) throw new Error(`Erro ao passar turno: ${turnError.message}`);
  }

  // ── Definir vencedor ──────────────────────────────────────────
  async setWinner(winnerId: string): Promise<void> {
    if (!this.roomId) return;

    await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerId })
      .eq('id', this.roomId);
  }

  // ── Passar turno explicitamente ───────────────────────────────
  async passTurn(nextPlayerId: string): Promise<void> {
    if (!this.roomId) return;

    await supabase
      .from('rooms')
      .update({ current_turn: nextPlayerId })
      .eq('id', this.roomId);
  }

  // ── Enviar mensagem rápida ────────────────────────────────────
  async sendMessage(message: string, type: 'quick' | 'text' = 'quick'): Promise<void> {
    if (!this.roomId) return;

    await supabase.from('room_messages').insert({
      room_id: this.roomId,
      player_id: this.userId,
      message,
      message_type: type,
    });
  }

  // ── Abandonar sala ────────────────────────────────────────────
  async leaveRoom(): Promise<void> {
    if (!this.roomId) return;

    await supabase
      .from('rooms')
      .update({ status: 'abandoned' })
      .eq('id', this.roomId);

    this.disconnect();
  }

  // ── Subscrever Realtime ───────────────────────────────────────
  private async subscribeToRoom(roomId: string): Promise<void> {
    // Proteção contra chamadas duplicadas ou concorrentes
    if (this.isSubscribing) {
      console.log('[Realtime] Subscrição já em andamento, ignorando...');
      return;
    }

    if (this.subscribedRoomId === roomId && this.channel) {
      console.log('[Realtime] Já subscrito na sala:', roomId);
      return;
    }

    this.isSubscribing = true;

    // Desconecta canal anterior completamente
    if (this.channel) {
      console.log('[Realtime] Removendo canal anterior...');
      await this.channel?.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.subscribedRoomId = null;
    }

    console.log('[Realtime] Criando novo canal para sala:', roomId);

    // Cria o canal e encadeia TODOS os .on() ANTES do .subscribe()
    this.channel = supabase
      .channel(`room:${roomId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      // Listener 1: Alterações na sala (turno, status, jogador 2 entrou)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as Room;
          this.callbacks.onRoomUpdate(room);

          // Detecta quando oponente entrou
          if (room.status === 'playing' && room.player_2_id && room.player_2_id !== this.userId) {
            this.callbacks.onOpponentJoined(room);
          }

          // Detecta abandono
          if (room.status === 'abandoned') {
            this.callbacks.onOpponentLeft();
          }
        },
      )
      // Listener 2: Nova jogada do oponente
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_shots', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const shot = payload.new as RoomShot;
          if (shot.player_id !== this.userId) {
            this.callbacks.onOpponentShot(shot);
          }
        },
      )
      // Listener 3: Mensagens de chat
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          this.callbacks.onMessage(payload.new as RoomMessage);
        },
      )
      // SÓ DEPOIS de todos os .on(), chama .subscribe() com callback de status
      .subscribe((status) => {
        this.isSubscribing = false;
        console.log('[Realtime] Status do canal:', status);

        if (status === 'SUBSCRIBED') {
          this.subscribedRoomId = roomId;
          console.log('[Realtime] ✅ Conectado na sala:', roomId);
          this.callbacks.onConnected?.();
        }

        if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] ❌ Canal fechado/erro:', status);
          this.callbacks.onDisconnected?.();
          this.subscribedRoomId = null;
        }
      });
  }

  // ── Desconectar ───────────────────────────────────────────────
  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomId = null;
    this.subscribedRoomId = null;
    this.isSubscribing = false;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }
}