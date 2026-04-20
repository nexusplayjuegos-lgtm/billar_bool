// src/hooks/useMultiplayer.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { MultiplayerClient } from '@/lib/multiplayer/client';
import { supabase } from '@/lib/supabase/client';
import type {
  BallState,
  GameMode,
  MultiplayerState,
  Room,
  RoomMessage,
  RoomShot,
} from '@/lib/multiplayer/types';

const INITIAL_STATE: MultiplayerState = {
  room: null,
  isConnected: false,
  isMyTurn: false,
  playerNumber: null,
  opponentShot: null,
  messages: [],
  error: null,
};

export function useMultiplayer() {
  const [state, setState] = useState<MultiplayerState>(INITIAL_STATE);
  const [userId, setUserId] = useState<string | null>(null);
  const clientRef = useRef<MultiplayerClient | null>(null);

  // ── Obter userId da sessão ────────────────────────────────────
  useEffect(() => {
    const getUser = async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    void getUser();
  }, []);

  // ── Inicializar cliente quando userId estiver disponível ──────
  useEffect(() => {
    if (!userId) return;

    const client = new MultiplayerClient(userId, {
      onRoomUpdate: (room: Room) => {
        setState((prev) => ({
          ...prev,
          room,
          isMyTurn: room.current_turn === userId,
        }));
      },

      onOpponentShot: (shot: RoomShot) => {
        setState((prev) => ({
          ...prev,
          opponentShot: shot,
          isMyTurn: true, // Oponente jogou → agora é a nossa vez
        }));
      },

      onMessage: (message: RoomMessage) => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
      },

      onOpponentJoined: (room: Room) => {
        setState((prev) => ({
          ...prev,
          room,
          isConnected: true,
          // Player 1 começa
          isMyTurn: room.player_1_id === userId,
        }));
      },

      onOpponentLeft: () => {
        setState((prev) => ({
          ...prev,
          error: 'O oponente abandonou a partida.',
          isConnected: false,
        }));
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [userId]);

  // ── Criar sala ────────────────────────────────────────────────
  const createRoom = useCallback(
    async (gameMode: GameMode = '8ball', betCoins = 0): Promise<Room | null> => {
      if (!userId) {
        setState((prev) => ({
          ...prev,
          error: 'Precisas de criar conta para jogar online.',
        }));
        return null;
      }
      const client = clientRef.current;
      if (!client) return null;

      try {
        setState((prev) => ({ ...prev, error: null }));
        const room = await client.createRoom(gameMode, betCoins);
        setState((prev) => ({
          ...prev,
          room,
          playerNumber: 1,
          isMyTurn: true, // Criador começa
          isConnected: false, // Aguarda oponente
        }));
        return room;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar sala.';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [userId],
  );

  // ── Entrar em sala ────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId: string): Promise<Room | null> => {
    const client = clientRef.current;
    if (!client) return null;

    try {
      setState((prev) => ({ ...prev, error: null }));
      const room = await client.joinRoom(roomId);
      setState((prev) => ({
        ...prev,
        room,
        playerNumber: 2,
        isMyTurn: false, // Jogador 2 espera
        isConnected: true,
      }));
      return room;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na sala.';
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  // ── Listar salas disponíveis ──────────────────────────────────
  const listRooms = useCallback(async (gameMode?: GameMode): Promise<Room[]> => {
    const client = clientRef.current;
    if (!client) return [];

    try {
      return await client.listAvailableRooms(gameMode);
    } catch {
      return [];
    }
  }, []);

  // ── Enviar jogada ─────────────────────────────────────────────
  const sendShot = useCallback(
    async (
      ballsState: BallState[],
      aimAngle: number,
      power: number,
      spinX = 0,
      spinY = 0,
    ): Promise<void> => {
      const client = clientRef.current;
      if (!client || !state.isMyTurn) return;

      try {
        await client.sendShot(ballsState, aimAngle, power, spinX, spinY);
        setState((prev) => ({ ...prev, isMyTurn: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar jogada.';
        setState((prev) => ({ ...prev, error: message }));
      }
    },
    [state.isMyTurn],
  );

  // ── Passar turno ──────────────────────────────────────────────
  const passTurn = useCallback(async (nextPlayerId: string): Promise<void> => {
    const client = clientRef.current;
    if (!client) return;
    await client.passTurn(nextPlayerId);
  }, []);

  // ── Definir vencedor ──────────────────────────────────────────
  const setWinner = useCallback(async (winnerId: string): Promise<void> => {
    const client = clientRef.current;
    if (!client) return;
    await client.setWinner(winnerId);
  }, []);

  // ── Enviar mensagem ───────────────────────────────────────────
  const sendMessage = useCallback(
    async (message: string, type: 'quick' | 'text' = 'quick'): Promise<void> => {
      const client = clientRef.current;
      if (!client) return;
      await client.sendMessage(message, type);
    },
    [],
  );

  // ── Sair da sala ──────────────────────────────────────────────
  const leaveRoom = useCallback(async (): Promise<void> => {
    const client = clientRef.current;
    if (!client) return;
    await client.leaveRoom();
    setState(INITIAL_STATE);
  }, []);

  // ── Limpar jogada do oponente após processar ──────────────────
  const clearOpponentShot = useCallback((): void => {
    setState((prev) => ({ ...prev, opponentShot: null }));
  }, []);

  return {
    // Estado
    room: state.room,
    isConnected: state.isConnected,
    isMyTurn: state.isMyTurn,
    playerNumber: state.playerNumber,
    opponentShot: state.opponentShot,
    messages: state.messages,
    error: state.error,
    userId,

    // Acções
    createRoom,
    joinRoom,
    listRooms,
    sendShot,
    passTurn,
    setWinner,
    sendMessage,
    leaveRoom,
    clearOpponentShot,
  };
}