'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { GameScreen } from '@/components/game/GameScreen';
import { MousePullBackInput } from '@/components/game/input/MousePullBackInput';
import { DesktopCueControls } from './DesktopCueControls';

interface DesktopGameScreenProps {
  modeId: string;
}

export function DesktopGameScreen({ modeId }: DesktopGameScreenProps) {
  const t = useTranslations('game');
  const { locale } = useLocale();
  const router = useRouter();
  const { endGame } = useGameStore();

  const handleExit = useCallback(() => {
    endGame(false);
    router.push(`/${locale}`);
  }, [endGame, router, locale]);

  return (
    <GameScreen
      onExit={handleExit}
      header={(engineState, _timeLeft) => (
        <header className="shrink-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t('back')}</span>
              </motion.button>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">{t('mode')}:</span>
              <span className="text-white font-medium">{modeId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExit}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
            >
              {t('exit')}
            </motion.button>
          </div>
        </header>
      )}
      overlay={(engineState, handlers) => (
        <MousePullBackInput
          balls={engineState.balls}
          onAimChange={handlers.onAimChange}
          onPowerChange={handlers.onPowerChange}
          onShoot={handlers.onShoot}
          disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2}
        />
      )}
      footer={(engineState, power, setPower, onShoot) => (
        <DesktopCueControls
          power={Math.round(power)}
          onPowerChange={setPower}
          disabled={engineState.ballsMoving || engineState.gameOver || engineState.currentPlayer === 2}
        />
      )}
    />
  );
}
