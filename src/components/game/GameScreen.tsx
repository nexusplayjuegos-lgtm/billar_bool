'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { useLocale } from '@/hooks';
import { gameEngine, createGameEngine, EngineState } from '@/lib/engine/gameEngine';
import { playTick } from '@/lib/audio/gameAudio';
import { useGameStore, useUserStore } from '@/lib/store';
import { MatchTable } from './MatchTable';
import { Confetti } from './Confetti';

export interface InputHandlers {
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
  onPlaceCueBall: (x: number, y: number) => void;
  ballInHand: boolean;
  isBreakShot: boolean;
}

interface GameScreenProps {
  header?: (state: EngineState, timeLeft: number) => ReactNode;
  overlay?: (state: EngineState, handlers: InputHandlers) => ReactNode;
  footer?: (state: EngineState, power: number, setPower: (p: number) => void, onShoot: () => void) => ReactNode;
  onExit: () => void;
  onShoot?: (power: number, aimAngle: number) => void;
  blockScroll?: boolean;
  tableScale?: number;
  gameMode?: '8ball' | 'brazilian';
  engine?: typeof gameEngine;
}

export function GameScreen({
  header,
  overlay,
  footer,
  onExit,
  onShoot: customOnShoot,
  blockScroll = false,
  tableScale,
  gameMode = '8ball',
  engine: customEngine,
}: GameScreenProps) {
  const engine = customEngine ?? gameEngine;
  const t = useTranslations('game');
  const { locale } = useLocale();
  const { endGame, potentialReward, entryFee } = useGameStore();
  const { addCoins, removeCoins, addXP, isGuest } = useUserStore();

  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    engine.setMode(gameMode);
    engine.start();
    const unsubscribe = engine.subscribe((state) => {
      setEngineState(state);
      if (state.gameOver && state.winner) {
        const won = state.winner === 1;
        const reward = won ? potentialReward : Math.floor(potentialReward * 0.1);
        // Atualiza economia e stats
        if (won) {
          addCoins(reward);
          addXP(100);
        } else {
          addCoins(reward);
          addXP(25);
        }
        if (won) {
          setShowWinModal(true);
        } else {
          setShowLoseModal(true);
        }
      }
    });
    return () => {
      unsubscribe();
      engine.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addCoins, addXP, potentialReward, gameMode]);

  useEffect(() => {
    if (!engineState || engineState.gameOver || engineState.ballsMoving) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          gameEngine.timeoutTurn();
          return 30;
        }
        if (prev <= 11) {
          playTick();
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
      if (customOnShoot) {
        customOnShoot(power, aimAngle);
      } else {
        engine.shoot(power, aimAngle, { x: 0, y: 0 });
      }
      setPower(0);
      setTimeLeft(30);
    }
    setIsAiming(false);
  }, [power, aimAngle, customOnShoot, engine]);

  const handlePlaceCueBall = useCallback((x: number, y: number) => {
    engine.placeCueBall(x, y);
  }, [engine]);

  useEffect(() => {
    if (showWinModal && isGuest) {
      const shown = localStorage.getItem('guest_win_popup_shown');
      if (!shown) setShowGuestPopup(true);
    }
  }, [showWinModal, isGuest]);

  const handleShare = async () => {
    const text = 'Ganhei uma partida de sinuca! 🎱 Joga comigo em billar-bool.vercel.app';
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

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
    onPlaceCueBall: handlePlaceCueBall,
    ballInHand: engineState.ballInHand && engineState.currentPlayer === 1,
    isBreakShot: engineState.isBreakShot,
  };

  return (
    <div className="h-dvh h-screen w-full flex flex-col bg-slate-950 overflow-hidden relative select-none">
      {header && header(engineState, timeLeft)}

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <MatchTable
          balls={engineState.balls}
          aimAngle={aimAngle}
          power={power}
          isAiming={isAiming}
          isBreakShot={engineState.isBreakShot}
          scale={tableScale}
        >
          {overlay && overlay(engineState, inputHandlers)}
        </MatchTable>
      </div>

      {/* Indicador de ball-in-hand / break shot */}
      {engineState.ballInHand && engineState.currentPlayer === 1 && !engineState.ballsMoving && !engineState.gameOver && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30">
          <div className="px-4 py-1.5 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-500/40 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs text-amber-300 font-bold">
              {engineState.isBreakShot ? t('breakShot') : t('ballInHand')}
            </span>
          </div>
        </div>
      )}

      {/* Indicador de vez do bot */}
      {engineState.currentPlayer === 2 && !engineState.ballsMoving && !engineState.gameOver && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-sm rounded-full border border-slate-700/50 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-300 font-medium">{t('botThinking')}</span>
          </div>
        </div>
      )}

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
            <Confetti active={showWinModal} />
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 100 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center relative z-[70]"
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
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-sm">$</div>
                <span className="text-3xl font-bold text-amber-400">+{potentialReward.toLocaleString()}</span>
              </motion.div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowWinModal(false);
                    endGame(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl"
                >
                  {t('doubleBet')}
                </motion.button>
                <Link href={`/${locale}`}>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl"
                  >
                    {t('lobby')}
                  </motion.button>
                </Link>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void handleShare()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Partilhar resultado
                </motion.button>
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
      {/* Guest Progress Popup */}
      <AnimatePresence>
        {showGuestPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl text-center"
            >
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="text-xl font-black text-white mb-2">
                Não percas o teu progresso!
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Cria conta gratuita e guarda as tuas vitórias
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('guest_win_popup_shown', '1');
                    setShowGuestPopup(false);
                    router.push(`/${locale}/login`);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all"
                >
                  Criar conta
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('guest_win_popup_shown', '1');
                    setShowGuestPopup(false);
                  }}
                  className="w-full py-3 text-slate-400 hover:text-slate-300 text-sm transition-colors"
                >
                  Continuar como convidado
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
