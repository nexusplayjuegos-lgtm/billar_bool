'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from '@/hooks';
import { gameEngine, EngineState } from '@/lib/engine/gameEngine';
import { useGameStore } from '@/lib/store';
import { PoolTable } from './PoolTable';
import { AimOverlay } from './AimOverlay';

export interface InputHandlers {
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
}

interface GameScreenProps {
  header?: (state: EngineState, timeLeft: number) => ReactNode;
  overlay?: (state: EngineState, handlers: InputHandlers) => ReactNode;
  footer?: (state: EngineState, power: number, setPower: (p: number) => void, onShoot: () => void) => ReactNode;
  onExit: () => void;
  blockScroll?: boolean;
}

export function GameScreen({
  header,
  overlay,
  footer,
  onExit,
  blockScroll = false,
}: GameScreenProps) {
  const t = useTranslations('game');
  const { locale } = useLocale();
  const { endGame } = useGameStore();

  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);

  useEffect(() => {
    gameEngine.start();
    const unsubscribe = gameEngine.subscribe((state) => {
      setEngineState(state);
      if (state.gameOver && state.winner) {
        if (state.winner === 1) {
          setShowWinModal(true);
        } else {
          setShowLoseModal(true);
        }
      }
    });
    return () => {
      unsubscribe();
      gameEngine.stop();
    };
  }, []);

  useEffect(() => {
    if (!engineState || engineState.gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [engineState]);

  useEffect(() => {
    if (!blockScroll) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [blockScroll]);

  const handleAimChange = useCallback((angle: number) => {
    setAimAngle(angle);
    setIsAiming(true);
  }, []);

  const handlePowerChange = useCallback((p: number) => {
    setPower(p);
  }, []);

  const handleShoot = useCallback(() => {
    if (power > 2) {
      gameEngine.shoot(power, aimAngle, { x: 0, y: 0 });
      setPower(0);
      setTimeLeft(30);
    }
    setIsAiming(false);
  }, [power, aimAngle]);

  if (!engineState) {
    return (
      <div className="h-dvh h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const inputHandlers: InputHandlers = {
    onAimChange: handleAimChange,
    onPowerChange: handlePowerChange,
    onShoot: handleShoot,
  };

  return (
    <div className="h-dvh h-screen w-full flex flex-col bg-slate-950 overflow-hidden relative select-none">
      {header && header(engineState, timeLeft)}

      <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-5xl">
          <PoolTable balls={engineState.balls} className="w-full h-full" />
          <AimOverlay
            balls={engineState.balls}
            aimAngle={aimAngle}
            power={power}
            isAiming={isAiming}
          />
          {overlay && overlay(engineState, inputHandlers)}
        </div>
      </div>

      {footer && footer(engineState, power, setPower, handleShoot)}

      {/* Win Modal */}
      <AnimatePresence>
        {showWinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 100 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <motion.h1
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-4"
              >
                {t('win')}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400" />
                <span className="text-3xl font-bold text-amber-400">+1,800</span>
              </motion.div>
              <div className="flex gap-3 justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowWinModal(false);
                    endGame(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl"
                >
                  {t('playAgain')}
                </motion.button>
                <Link href={`/${locale}`}>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl"
                  >
                    {t('lobby')}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lose Modal */}
      <AnimatePresence>
        {showLoseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="text-center"
            >
              <motion.h1
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-5xl font-black text-slate-500 mb-4"
              >
                {t('loss')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 mb-6"
              >
                Não desista! Tente novamente.
              </motion.p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowLoseModal(false);
                    endGame(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl"
                >
                  {t('tryAgain')}
                </motion.button>
                <Link href={`/${locale}`}>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl"
                  >
                    {t('lobby')}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
