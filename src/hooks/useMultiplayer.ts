// src/hooks/useMultiplayer.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { MultiplayerClient } from '@/lib/multiplayer/client';
import { useUserStore } from '@/lib/store/userStore';
import type {
  BallState,
  GameMode,
  MultiplayerState,
  Room,
  RoomMessage,
  RoomShot,
  ShotStart,
  TurnTimeout,
} from '@/lib/multiplayer/types';
import type { EngineState } from '@/lib/engine/gameEngine';

const INITIAL_STATE: MultiplayerState = {
  room: null,
  isConnected: false,
  isMyTurn: false,
  playerNumber: null,
  opponentShot: null,
  opponentShotStart: null,
  turnTimeout: null,
  messages: [],
  error: null,
};

export function useMultiplayer() {
  const [state, setState] = useState<MultiplayerState>(INITIAL_STATE);
  const clientRef = useRef<MultiplayerClient | null>(null);
  
  // Usar o userStore em vez de gerenciar sessão localmente
  const { session, isSessionLoaded } = useUserStore();
  const userId = session?.user?.id ?? null;

  console.log('[useMultiplayer] Render:', { userId: userId?.slice(0, 8), isSessionLoaded });

  // ── Inicializar cliente quando userId estiver disponível ──────
  useEffect(() => {
    console.log('[useMultiplayer] Client init effect:', { userId: userId?.slice(0, 8), isSessionLoaded });
    if (!userId || !isSessionLoaded) return;

    const client = new MultiplayerClient(userId, {
      onRoomUpdate: (room: Room) => {
        setState((prev) => ({
          ...prev,
          room,
          isConnected: room.status === 'playing' && !!room.player_1_id && !!room.player_2_id,
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

      onOpponentShotStart: (shot: ShotStart) => {
        setState((prev) => ({
          ...prev,
          opponentShotStart: shot,
        }));
      },

      onTurnTimeout: (timeout: TurnTimeout) => {
        setState((prev) => ({
          ...prev,
          turnTimeout: timeout,
          isMyTurn: timeout.next_player_id === userId,
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
  }, [userId, isSessionLoaded]);

  // ── Criar sala ────────────────────────────────────────────────
  const createRoom = useCallback(
    async (gameMode: GameMode = '8ball', betCoins = 0): Promise<Room | null> => {
      console.log('[useMultiplayer] createRoom:', { userId: userId?.slice(0, 8), isSessionLoaded });
      if (!userId || !isSessionLoaded) {
        setState((prev) => ({
          ...prev,
          error: 'Precisas de criar conta para jogar online.',
        }));
        return null;
      }
      const client = clientRef.current;
      if (!client) {
        setState((prev) => ({ ...prev, error: 'A ligar ao servidor. Tenta novamente.' }));
        return null;
      }

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
    [userId, isSessionLoaded],
  );

  // ── Entrar em sala ────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId: string): Promise<Room | null> => {
    console.log('[useMultiplayer] joinRoom:', { roomId, userId: userId?.slice(0, 8), isSessionLoaded });
    if (!userId || !isSessionLoaded) {
      setState((prev) => ({
        ...prev,
        error: 'Precisas de criar conta para jogar online.',
      }));
      return null;
    }
    const client = clientRef.current;
    if (!client) {
      setState((prev) => ({ ...prev, error: 'A ligar ao servidor. Tenta novamente.' }));
      return null;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));
      const room = await client.joinRoom(roomId);
      const playerNumber = room.player_1_id === userId ? 1 : 2;
      setState((prev) => ({
        ...prev,
        room,
        playerNumber,
        isMyTurn: room.current_turn === userId,
        isConnected: room.status === 'playing',
      }));
      return room;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na sala.';
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, [userId, isSessionLoaded]);

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
      gameState?: EngineState,
      spinX = 0,
      spinY = 0,
    ): Promise<void> => {
      const client = clientRef.current;
      if (!client || !state.isMyTurn || !state.isConnected) return;

      try {
        await client.sendShot(ballsState, aimAngle, power, gameState, spinX, spinY);
        setState((prev) => ({ ...prev, isMyTurn: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar jogada.';
        setState((prev) => ({ ...prev, error: message }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.isMyTurn],
  );

  const sendShotStart = useCallback(
    async (aimAngle: number, power: number): Promise<void> => {
      const client = clientRef.current;
      if (!client || !state.isMyTurn || !state.isConnected) return;
      await client.sendShotStart(aimAngle, power);
    },
    [state.isConnected, state.isMyTurn],
  );

  const sendTurnTimeout = useCallback(
    async (nextPlayerId: string): Promise<void> => {
      const client = clientRef.current;
      if (!client) return;
      await client.sendTurnTimeout(nextPlayerId);
    },
    [],
  );

  const requestTurnTimeout = useCallback(
    async (timedOutPlayerId: string, nextPlayerId: string): Promise<Room | null> => {
      const client = clientRef.current;
      if (!client) return null;
      const room = await client.requestTurnTimeout(timedOutPlayerId, nextPlayerId);
      if (room) {
        setState((prev) => ({
          ...prev,
          room,
          isConnected: room.status === 'playing' && !!room.player_1_id && !!room.player_2_id,
          isMyTurn: room.current_turn === userId,
        }));
      }
      return room;
    },
    [userId],
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

  const clearOpponentShotStart = useCallback((): void => {
    setState((prev) => ({ ...prev, opponentShotStart: null }));
  }, []);

  const clearTurnTimeout = useCallback((): void => {
    setState((prev) => ({ ...prev, turnTimeout: null }));
  }, []);

  return {
    // Estado
    room: state.room,
    isConnected: state.isConnected,
    isMyTurn: state.isMyTurn,
    playerNumber: state.playerNumber,
    opponentShot: state.opponentShot,
    opponentShotStart: state.opponentShotStart,
    turnTimeout: state.turnTimeout,
    messages: state.messages,
    error: state.error,
    userId,

    // Acções
    createRoom,
    joinRoom,
    listRooms,
    sendShotStart,
    sendTurnTimeout,
    requestTurnTimeout,
    sendShot,
    passTurn,
    setWinner,
    sendMessage,
    leaveRoom,
    clearOpponentShot,
    clearOpponentShotStart,
    clearTurnTimeout,
  };
}
