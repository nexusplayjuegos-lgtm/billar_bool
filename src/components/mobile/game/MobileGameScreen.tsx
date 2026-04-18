'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useImmersiveMatch } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { GameScreen } from '@/components/game/GameScreen';
import { TouchDragInput } from '@/components/game/input/TouchDragInput';
import { GameHUD } from './GameHUD';
import { GameExitButton } from './GameExitButton';

export function MobileGameScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { endGame } = useGameStore();
  const { containerRef } = useImmersiveMatch();

  const handleExitGame = useCallback(() => {
    endGame(false);
    router.push(`/${locale}`);
  }, [endGame, router, locale]);

  return (
    <div ref={containerRef} className="h-dvh h-screen w-full">
      <GameScreen
        blockScroll
        onExit={handleExitGame}
        tableScale={0.92}
        header={(engineState, timeLeft) => (
          <div className="shrink-0 h-12 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm z-20 border-b border-slate-800/50">
            <div className="flex-1 min-w-0">
              <GameHUD timeLeft={timeLeft} engineState={engineState} />
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
            disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2}
          />
        )}
      />
    </div>
  );
}
