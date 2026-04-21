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
}

export class MultiplayerClient {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private userId: string;
  private callbacks: MultiplayerClientCallbacks;
  private lastShotNumber = 0;

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
      .update({ current_turn: null }) // null = aguarda definição pelo próximo evento
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
  private subscribeToRoom(roomId: string): void {
    this.channel = supabase
      .channel(`room:${roomId}`)

      // Alterações na sala (turno, status, jogador 2 entrou)
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

      // Nova jogada do oponente
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_shots', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const shot = payload.new as RoomShot;
          // Ignora as próprias jogadas
          if (shot.player_id !== this.userId) {
            this.callbacks.onOpponentShot(shot);
          }
        },
      )

      // Mensagens de chat
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          this.callbacks.onMessage(payload.new as RoomMessage);
        },
      )

      .subscribe();
  }

  // ── Desconectar ───────────────────────────────────────────────
  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomId = null;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }
}