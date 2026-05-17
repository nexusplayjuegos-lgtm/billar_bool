'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useImmersiveMatch, useViewportHeight } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { GameScreen } from '@/components/game/GameScreen';
import { TouchDragInput } from '@/components/game/input/TouchDragInput';
import { GameHUD } from './GameHUD';
import { GameExitButton } from './GameExitButton';
import { PowerSlider } from './PowerSlider';

export function MobileGameScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { endGame, modeType } = useGameStore();
  const { containerRef } = useImmersiveMatch();
  const viewportHeight = useViewportHeight();
  const useCompactControls = viewportHeight > 0 && viewportHeight < 500;

  const handleExitGame = useCallback(() => {
    endGame(false);
    router.push(`/${locale}`);
  }, [endGame, router, locale]);

  return (
    <div ref={containerRef} className="game-fullscreen">
      <GameScreen
        blockScroll
        onExit={handleExitGame}
        tableScale={1}
        gameMode={modeType === 'brazilian' ? 'brazilian' : '8ball'}
        header={(engineState, timeLeft) => (
          <div className="mobile-game-header shrink-0 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm z-20 border-b border-slate-800/50">
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
            onPlaceCueBall={handlers.onPlaceCueBall}
            ballInHand={handlers.ballInHand}
            isBreakShot={handlers.isBreakShot}
            disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2}
          />
        )}
        footer={(engineState, power, setPower, onShoot) => (
          <div className={useCompactControls ? 'pointer-events-none absolute left-[calc(env(safe-area-inset-left)+0.5rem)] top-1/2 z-30 -translate-y-1/2' : 'mobile-power-footer shrink-0 border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-sm'}>
            <div className={useCompactControls ? 'pointer-events-auto rounded-xl border border-slate-700/60 bg-slate-950/55 p-1 shadow-lg shadow-black/20 backdrop-blur-sm' : undefined}>
              <PowerSlider
                value={Math.round(power)}
                onChange={setPower}
                onShoot={onShoot}
                orientation={useCompactControls ? 'vertical' : 'horizontal'}
                disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2 || engineState.ballInHand}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
