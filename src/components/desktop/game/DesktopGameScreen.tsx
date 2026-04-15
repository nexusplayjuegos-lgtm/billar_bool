'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DesktopPoolTable } from './DesktopPoolTable';
import { DesktopGameHUD } from './DesktopGameHUD';
import { DesktopCueControls } from './DesktopCueControls';
import { GameExitModal } from './GameExitModal';
import { useGameStore } from '@/lib/store';
import { useLocale } from '@/hooks';
import { cn } from '@/lib/utils';

interface DesktopGameScreenProps {
  modeId: string;
}

export function DesktopGameScreen({ modeId }: DesktopGameScreenProps) {
  const t = useTranslations('game');
  const { locale } = useLocale();
  const { gameState, shoot, endGame } = useGameStore();

  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [ballsMoving, setBallsMoving] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Detectar quando bolas estão em movimento
  useEffect(() => {
    if (!gameState) return;

    const checkMovement = () => {
      const moving = gameState.balls.some(
        (ball) => Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1
      );
      setBallsMoving(moving);
    };

    const interval = setInterval(checkMovement, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleShoot = useCallback(
    (shotPower: number, shotAngle: number) => {
      if (ballsMoving) return;
      shoot(shotPower, shotAngle, { x: 0, y: 0 });
      setPower(0);
      setTimeLeft(30);

      // Simular fim de jogo após 5 segundos
      setTimeout(() => {
        const won = Math.random() > 0.5;
        if (won) {
          setShowWinModal(true);
        } else {
          setShowLoseModal(true);
        }
      }, 5000);
    },
    [shoot, ballsMoving]
  );

  const handleExit = useCallback(() => {
    // Aplicar punição de 50% da taxa de entrada
    endGame(false);
    setShowExitModal(false);
  }, [endGame]);

  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
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
            onClick={() => setShowExitModal(true)}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
          >
            {t('exit')}
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Game Area */}
        <main className="flex-1 flex flex-col p-4 min-h-0">
          <DesktopGameHUD timeLeft={timeLeft} modeId={modeId} />

          {/* Pool Table - ajustado para caber sem scroll */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div
              className="relative w-full h-full max-w-5xl"
              style={{ maxHeight: '100%' }}
            >
              <DesktopPoolTable
                aimAngle={aimAngle}
                onAimChange={setAimAngle}
                power={power}
                onPowerChange={setPower}
                onShoot={handleShoot}
                disabled={ballsMoving}
              />
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 shrink-0 bg-slate-900 border-l border-slate-800 p-4 flex flex-col">
          <h3 className="text-white font-bold mb-4">{t('matchInfo')}</h3>

          {/* Player Info */}
          <div className="space-y-3 mb-6">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  EU
                </div>
                <div>
                  <p className="text-white font-medium">{t('you')}</p>
                  <p className="text-slate-400 text-sm">{t('yourTurn')}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                  BOT
                </div>
                <div>
                  <p className="text-white font-medium">{t('opponent')}</p>
                  <p className="text-slate-400 text-sm">{t('waiting')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800 rounded-lg p-3 mb-4">
            <h4 className="text-slate-400 text-sm mb-2">{t('stats')}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shots')}</span>
                <span className="text-white">{gameState.shots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('ballsPocketed')}</span>
                <span className="text-white">
                  {gameState.balls.filter((b) => b.inPocket).length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <p className="text-slate-500 text-xs text-center">
              {t('desktopInstructions')}
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Controls */}
      <DesktopCueControls
        power={Math.round(power)}
        onPowerChange={setPower}
        disabled={ballsMoving}
      />

      {/* Exit Modal */}
      <GameExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleExit}
        penalty={gameState ? Math.floor(gameState.balls[0]?.id || 100) : 100}
      />

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
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-6"
              >
                {t('win')}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 mb-8"
              >
                <div className="w-10 h-10 rounded-full bg-amber-400" />
                <span className="text-4xl font-bold text-amber-400">+1,800</span>
              </motion.div>

              <div className="flex gap-4 justify-center">
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
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl"
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
                    className="px-8 py-3 bg-slate-700 text-white font-bold rounded-xl"
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
                className="text-6xl font-black text-slate-500 mb-4"
              >
                {t('loss')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 mb-6 text-lg"
              >
                {t('dontGiveUp')}
              </motion.p>

              <div className="flex gap-4 justify-center">
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
                  className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl"
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
                    className="px-8 py-3 bg-slate-700 text-white font-bold rounded-xl"
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
