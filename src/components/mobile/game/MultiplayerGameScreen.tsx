'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useImmersiveMatch } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { useUserStore } from '@/lib/store/userStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { createGameEngine } from '@/lib/engine/gameEngine';
import { fetchProfile } from '@/lib/supabase/client';
import { GameScreen } from '@/components/game/GameScreen';
import { TouchDragInput } from '@/components/game/input/TouchDragInput';
import { GameExitButton } from './GameExitButton';
import { MultiplayerGameHUD } from './MultiplayerGameHUD';
import type { Tables } from '@/lib/supabase/client';

interface MultiplayerGameScreenProps {
  roomId: string;
}

export function MultiplayerGameScreen({ roomId }: MultiplayerGameScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { endGame, modeType } = useGameStore();
  const { containerRef } = useImmersiveMatch();
  const engineRef = useRef(createGameEngine(modeType === 'brazilian' ? 'brazilian' : '8ball'));

  const {
    room,
    isConnected,
    isMyTurn,
    playerNumber,
    opponentShot,
    error,
    joinRoom,
    sendShot,
    leaveRoom,
    clearOpponentShot,
  } = useMultiplayer();

  const { session, isSessionLoaded } = useUserStore();
  const [myProfile, setMyProfile] = useState<Tables['profiles'] | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<Tables['profiles'] | null>(null);
  const [joining, setJoining] = useState(true);
  const hasJoinedRef = useRef(false);

  // Entrar na sala ao montar (apenas uma vez) — aguarda sessão carregar primeiro
  useEffect(() => {
    console.log('[MultiplayerGameScreen] Effect triggered:', { isSessionLoaded, hasUserId: !!session?.user?.id, roomId });
    let mounted = true;
    async function enter() {
      if (!mounted || hasJoinedRef.current || !isSessionLoaded) {
        console.log('[MultiplayerGameScreen] Skipping join:', { mounted, hasJoined: hasJoinedRef.current, isSessionLoaded });
        return;
      }
      hasJoinedRef.current = true;
      setJoining(true);
      console.log('[MultiplayerGameScreen] Calling joinRoom...');
      const result = await joinRoom(roomId);
      console.log('[MultiplayerGameScreen] joinRoom result:', result ? 'success' : 'failed');
      if (mounted) setJoining(false);
    }
    enter();
    return () => {
      mounted = false;
    };
  }, [roomId, joinRoom, isSessionLoaded, session?.user?.id]);

  // Ativar modo multiplayer no engine
  useEffect(() => {
    const engine = engineRef.current;
    engine.setMultiplayerMode(true);
    return () => {
      engine.setMultiplayerMode(false);
    };
  }, []);

  // Buscar perfis dos jogadores
  useEffect(() => {
    if (!room) return;

    async function loadProfiles(currentRoom: typeof room) {
      if (!currentRoom) return;
      const myId = session?.user?.id;
      if (!myId) return;

      const opponentId = currentRoom.player_1_id === myId ? currentRoom.player_2_id : currentRoom.player_1_id;

      const me = await fetchProfile(myId);
      if (me) setMyProfile(me);

      if (opponentId) {
        const opp = await fetchProfile(opponentId);
        if (opp) setOpponentProfile(opp);
      }
    }

    loadProfiles(room);
  }, [room, session?.user?.id]);

  // Aplicar jogada do oponente
  useEffect(() => {
    if (!opponentShot) return;
    engineRef.current.applyOpponentShot(opponentShot.aim_angle, opponentShot.power);
    clearOpponentShot();
  }, [opponentShot, clearOpponentShot]);

  const handleExitGame = useCallback(() => {
    leaveRoom();
    endGame(false);
    router.push(`/${locale}`);
  }, [leaveRoom, endGame, router, locale]);

  const handleShoot = useCallback(
    (power: number, aimAngle: number) => {
      // 1. Disparar localmente
      engineRef.current.shoot(power, aimAngle, { x: 0, y: 0 });

      // 2. Enviar para o servidor
      if (room && isMyTurn) {
        const ballsState = engineRef.current.getState().balls.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          vx: b.vx,
          vy: b.vy,
          inPocket: b.inPocket,
          rotation: b.rotation,
        }));
        void sendShot(ballsState, aimAngle, power);
      }
    },
    [isMyTurn, room, sendShot]
  );

  if (joining) {
    return (
      <div className="h-dvh h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">A entrar na sala...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh h-screen flex flex-col items-center justify-center bg-slate-950 gap-4 px-6">
        <span className="text-red-400 text-center">{error}</span>
        <button
          onClick={handleExitGame}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
        >
          Voltar ao Lobby
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-dvh h-screen w-full">
      <GameScreen
        blockScroll
        onExit={handleExitGame}
        onShoot={handleShoot}
        tableScale={0.92}
        gameMode={modeType === 'brazilian' ? 'brazilian' : '8ball'}
        engine={engineRef.current}
        header={(engineState, timeLeft) => (
          <div className="shrink-0 h-12 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm z-20 border-b border-slate-800/50">
            <div className="flex-1 min-w-0">
              <MultiplayerGameHUD
                timeLeft={timeLeft}
                engineState={engineState}
                myProfile={myProfile}
                opponentProfile={opponentProfile}
                isMyTurn={isMyTurn}
                playerNumber={playerNumber}
              />
            </div>
            <GameExitButton
              onExit={handleExitGame}
              penalty={100}
              className="ml-2 shrink-0"
            />
          </div>
        )}
        overlay={(engineState, handlers) => (
          <TouchDragInput
            balls={engineState.balls}
            onAimChange={handlers.onAimChange}
            onPowerChange={handlers.onPowerChange}
            onShoot={handlers.onShoot}
            onPlaceCueBall={handlers.onPlaceCueBall}
            ballInHand={handlers.ballInHand}
            isBreakShot={handlers.isBreakShot}
            disabled={engineState.ballsMoving || engineState.gameOver || !isMyTurn}
          />
        )}
      />
    </div>
  );
}
