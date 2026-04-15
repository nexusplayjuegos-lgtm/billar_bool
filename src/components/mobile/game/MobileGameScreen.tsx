'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PoolTable } from './PoolTable';
import { AimControl } from './AimControl';
import { PowerSlider } from './PowerSlider';
import { ShootButton } from './ShootButton';
import { GameHUD } from './GameHUD';
import { CueStick } from './CueStick';
import { GameExitButton } from './GameExitButton';
import { useLocale } from '@/hooks';
import { useGameStore } from '@/lib/store';
import { useVibration } from '@/hooks';
import { cn } from '@/lib/utils';

export function MobileGameScreen() {
  const t = useTranslations('game');
  const router = useRouter();
  const { locale } = useLocale();
  const { gameState, shoot, endGame } = useGameStore();
  const { vibrateHeavy } = useVibration();

  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(50);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [isAiming, setIsAiming] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - foul
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Bloquear scroll da página durante o jogo
  useEffect(() => {
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height,
      touchAction: document.body.style.touchAction,
    };

    // Bloquear scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';

    // Prevenir scroll em touch
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      // Restaurar estilos originais
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.width = originalStyle.width;
      document.body.style.height = originalStyle.height;
      document.body.style.touchAction = originalStyle.touchAction;
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const handleShoot = useCallback(() => {
    vibrateHeavy();
    shoot(power, aimAngle, { x: 0, y: 0 });
    setTimeLeft(30);

    // Simulate game end after 5 seconds (for demo)
    setTimeout(() => {
      const won = Math.random() > 0.5;
      if (won) {
        setShowWinModal(true);
      } else {
        setShowLoseModal(true);
      }
    }, 5000);
  }, [power, aimAngle, shoot, vibrateHeavy]);

  const handleExitGame = useCallback(() => {
    // Aplicar punição de 50% da taxa de entrada
    endGame(false);
    router.push(`/${locale}`);
  }, [endGame, router, locale]);

  if (!gameState) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Game Area */}
      <div className="flex-1 relative p-4">
        {/* Header com GameHUD e Exit Button */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <GameHUD timeLeft={timeLeft} />
          </div>
          <GameExitButton
            onExit={handleExitGame}
            penalty={gameState?.balls[0]?.id ? 100 : 100}
            className="ml-2 mt-2"
          />
        </div>

        {/* Pool Table */}
        <div className="relative h-full flex items-center justify-center">
          <div
            className="relative w-full aspect-[2/1]"
            onMouseEnter={() => setIsAiming(true)}
            onMouseLeave={() => setIsAiming(false)}
            onTouchStart={() => setIsAiming(true)}
            onTouchEnd={() => setIsAiming(false)}
          >
            <PoolTable className="w-full h-full" />
            <AimControl onAimChange={setAimAngle} />
            <CueStick
              angle={aimAngle}
              power={power}
              isAiming={isAiming}
              cueName="Taco Clássico"
              cueColor="#8B5A2B"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-32 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-700 px-6 py-3 flex items-center justify-between">
        {/* Power Slider */}
        <PowerSlider value={power} onChange={setPower} />

        {/* Center - Turn Indicator */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30"
          >
            <span className="text-blue-400 text-sm font-bold">
              {t('yourTurn')}
            </span>
          </motion.div>
        </div>

        {/* Shoot Button */}
        <ShootButton onShoot={handleShoot} disabled={false} />
      </div>

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
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: '50%', 
                      y: '50%',
                      rotate: 0 
                    }}
                    animate={{ 
                      x: `${50 + (Math.random() - 0.5) * 100}%`, 
                      y: `${50 + (Math.random() - 0.5) * 100}%`,
                      rotate: 360 
                    }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="absolute w-3 h-3 rounded"
                    style={{
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
                    }}
                  />
                ))}
              </div>

              <motion.h1
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-4"
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
                <span className="text-3xl font-bold text-amber-400">
                  +1,800
                </span>
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
