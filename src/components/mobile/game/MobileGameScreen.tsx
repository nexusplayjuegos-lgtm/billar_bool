'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useImmersiveMatch } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { GameScreen } from '@/components/game/GameScreen';
import { TouchDragInput } from '@/components/game/input/TouchDragInput';
import { GameHUD } from './GameHUD';
import { GameExitButton } from './GameExitButton';
import { PowerSlider } from './PowerSlider';

export function MobileGameScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { endGame, modeType, opponent } = useGameStore();
  const { containerRef } = useImmersiveMatch();
  const [tableZoom, setTableZoom] = useState(1);

  const handleExitGame = useCallback(() => {
    endGame(false);
    router.push(`/${locale}`);
  }, [endGame, router, locale]);

  return (
    <div ref={containerRef} className="game-fullscreen">
      <GameScreen
        blockScroll
        onExit={handleExitGame}
        tableScale={tableZoom}
        pocketedRackVariant="overlay"
        gameMode={modeType === 'brazilian' ? 'brazilian' : '8ball'}
        header={(engineState, timeLeft) => (
          <div className="mobile-game-header shrink-0 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm z-20 border-b border-slate-800/50">
            <div className="flex-1 min-w-0">
              <GameHUD timeLeft={timeLeft} engineState={engineState} opponent={opponent} />
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
            aimAngle={handlers.aimAngle}
            disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2}
            tableZoom={tableZoom}
            onTableZoomChange={setTableZoom}
          />
        )}
        footer={(engineState, power, setPower, onShoot) => (
          <div className="mobile-power-footer">
            <div className="mobile-power-inner">
              <PowerSlider
                value={Math.round(power)}
                onChange={setPower}
                onShoot={onShoot}
                orientation="vertical"
                disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2 || engineState.ballInHand}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
