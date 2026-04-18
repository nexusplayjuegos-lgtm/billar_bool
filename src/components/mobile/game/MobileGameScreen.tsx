'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale, useImmersiveMatch } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { GameScreen } from '@/components/game/GameScreen';
import { TouchDragInput } from '@/components/game/input/TouchDragInput';
import { GameHUD } from './GameHUD';
import { GameExitButton } from './GameExitButton';
import { PowerSlider } from './PowerSlider';
import { ShootButton } from './ShootButton';

export function MobileGameScreen() {
  const t = useTranslations('game');
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
        header={(engineState, timeLeft) => (
          <div className="shrink-0 h-14 landscape:h-12 px-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm z-20 border-b border-slate-800/50">
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
            disabled={engineState.ballsMoving || engineState.gameOver}
          />
        )}
        footer={(engineState, power, setPower, onShoot) => (
          <div className="shrink-0 landscape:h-auto h-28 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-700 px-4 py-2 landscape:py-1 flex items-center justify-between gap-3">
            <PowerSlider value={power} onChange={setPower} />
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="px-4 py-1.5 landscape:px-3 landscape:py-1 rounded-full bg-blue-500/20 border border-blue-500/30"
              >
                <span className="text-blue-400 text-sm landscape:text-xs font-bold">
                  {engineState.currentPlayer === 1 ? t('yourTurn') : t('opponentTurn')}
                </span>
              </motion.div>
            </div>
            <ShootButton onShoot={onShoot} disabled={engineState.ballsMoving || engineState.gameOver} />
          </div>
        )}
      />
    </div>
  );
}
