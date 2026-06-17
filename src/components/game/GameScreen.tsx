'use client';

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, Share2 } from 'lucide-react';
import { useLocale, useDesignKeyMap } from '@/hooks';
import { GameEngine, createGameEngine, EngineState } from '@/lib/engine/gameEngine';
import { useVictoryBoxes } from '@/hooks/useVictoryBoxes';
import { usePoolPass } from '@/hooks/usePoolPass';
import { useMissions } from '@/hooks/useMissions';
import { useAchievements } from '@/hooks/useAchievements';
import { playTick, unlockAudio } from '@/lib/audio/gameAudio';
import { audioManager } from '@/lib/audio/audioManager';
import { trackEvent, trackFirstGame } from '@/lib/analytics/analytics';
import { useGameStore, useUserStore } from '@/lib/store';
import { resolveDesignKey } from '@/lib/shop/resolveDesignKey';
import { MatchTable } from './MatchTable';
import { PocketedBallRack } from './PocketedBallRack';
import { Confetti } from './Confetti';
import { MatchStartAnimation } from './MatchStartAnimation';
import { GameTutorial } from '@/components/tutorial/GameTutorial';
import type { AchievementProgress, AchievementUpdateResult } from '@/types';

const MIN_SHOOT_POWER = 8;
interface TableRenderSize {
  width: number;
  height: number;
}

export interface InputHandlers {
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: (shotPower?: number) => void;
  onPlaceCueBall: (x: number, y: number) => void;
  ballInHand: boolean;
  isBreakShot: boolean;
  aimAngle: number;
  power: number;
}

interface GameScreenProps {
  header?: (state: EngineState, timeLeft: number) => ReactNode;
  overlay?: (state: EngineState, handlers: InputHandlers) => ReactNode;
  pocketedRackVariant?: 'flow' | 'overlay' | 'hidden';
  footer?: (
    state: EngineState,
    power: number,
    setPower: (p: number) => void,
    onShoot: (shotPower?: number) => void,
    tableSize: TableRenderSize
  ) => ReactNode;
  onExit: () => void;
  onShoot?: (power: number, aimAngle: number) => void;
  blockScroll?: boolean;
  tableScale?: number;
  gameMode?: '8ball' | 'brazilian';
  engine?: GameEngine;
  enableLocalTurnTimer?: boolean;
  showBotThinking?: boolean;
  externalTimeLeft?: number;
  localPlayerNumber?: 1 | 2;
  opponentAim?: { angle: number; power: number } | null;
  onAimPreview?: (angle: number, power: number) => void;
}

declare global {
  interface Window {
    __gameState?: EngineState | null;
  }
}

export function GameScreen({
  header,
  overlay,
  pocketedRackVariant = 'flow',
  footer,
  onExit,
  onShoot: customOnShoot,
  blockScroll = false,
  tableScale,
  gameMode = '8ball',
  engine: customEngine,
  enableLocalTurnTimer = true,
  showBotThinking = true,
  externalTimeLeft,
  localPlayerNumber = 1,
  opponentAim,
  onAimPreview,
}: GameScreenProps) {
  const localEngineRef = useRef<GameEngine | null>(null);
  if (!localEngineRef.current) {
    localEngineRef.current = createGameEngine(gameMode);
  }
  const engine = customEngine ?? localEngineRef.current;
  const t = useTranslations('game');
  const { locale } = useLocale();
  const { endGame, startGame, currentMode, modeType, potentialReward, entryFee, opponent } = useGameStore();
  const { profile, addCoins, removeCoins, addXP, isGuest, session } = useUserStore();
  const designKeyMap = useDesignKeyMap();
  const resolvedTableId = resolveDesignKey(profile.equipment.currentTable, designKeyMap);
  const resolvedCueId = resolveDesignKey(profile.equipment.currentCue, designKeyMap);
  const { createBox } = useVictoryBoxes();
  const { addPoolPoints } = usePoolPass();
  const { daily, weekly, updateProgress } = useMissions();
  const { updateAchievement, claimAchievement } = useAchievements();

  // Refs para evitar re-subscrição do engine quando valores mudam
  const sessionRef = useRef(session);
  const dailyRef = useRef(daily);
  const weeklyRef = useRef(weekly);
  const profileRef = useRef(profile);
  const isGuestRef = useRef(isGuest);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { dailyRef.current = daily; }, [daily]);
  useEffect(() => { weeklyRef.current = weekly; }, [weekly]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { isGuestRef.current = isGuest; }, [isGuest]);

  // Helper para encontrar e atualizar missão por tipo
  const findAndUpdateMission = useCallback(
    (scope: 'daily' | 'weekly', type: string, amount = 1) => {
      const missions = scope === 'daily'
        ? (dailyRef.current?.missions ?? [])
        : (weeklyRef.current?.challenges ?? []);
      for (const mission of missions) {
        if (mission.type === type && !mission.completed) {
          console.log(`[GameScreen] Updating ${scope} mission:`, mission.id, type, '+', amount);
          const willComplete = mission.current + amount >= mission.target;
          void updateProgress(scope, mission.id, amount).then((success) => {
            if (success && willComplete) {
              trackEvent('mission_completed', { scope, type, mission_id: mission.id });
            }
          });
        }
      }
    },
    [updateProgress]
  );

  const showUnlockedAchievement = useCallback((result: AchievementUpdateResult | null) => {
    if (result?.completed && result.achievement) {
      audioManager.play('achievement');
      trackEvent('achievement_unlocked', {
        code: result.achievement.code,
        category: result.achievement.category,
        tier: result.achievement.tier,
      });
      setUnlockedAchievement((current) => current ?? result.achievement);
    }
  }, []);

  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [cueStrikeActive, setCueStrikeActive] = useState(false);
  const [tableSize, setTableSize] = useState<TableRenderSize>({ width: 800, height: 400 });
  const cueStrikeTimeoutRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementProgress | null>(null);
  const [matchStartKey, setMatchStartKey] = useState(0);
  const [showBreakFlash, setShowBreakFlash] = useState(false);
  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ won: boolean; foul: boolean; reward: number } | null>(null);
  const router = useRouter();
  const previousBallsMovingRef = useRef<boolean | null>(null);
  const gameResultHandledRef = useRef(false);
  const achievementWinStreakRef = useRef(profile.stats?.currentWinStreak ?? 0);
  const timeoutHandledTurnRef = useRef<string | null>(null);
  const hasEngineState = engineState !== null;
  const engineGameOver = engineState?.gameOver ?? false;
  const engineBallsMoving = engineState?.ballsMoving ?? false;
  const engineCurrentPlayer = engineState?.currentPlayer ?? null;
  const engineTurn = engineState?.turn ?? null;
	
  useEffect(() => {
    audioManager.preload();
    achievementWinStreakRef.current = profile.stats?.currentWinStreak ?? achievementWinStreakRef.current;
  }, [profile.stats?.currentWinStreak]);

// Resetar quando nova partida inicia (engineState.gameOver volta a false)
useEffect(() => {
  if (hasEngineState && !engineGameOver) {
    gameResultHandledRef.current = false;
  }
}, [hasEngineState, engineGameOver]);

  useEffect(() => {
    gameResultHandledRef.current = false;
    engine.setMode(gameMode);
    engine.start();
    trackEvent('game_started', { mode: gameMode, player: localPlayerNumber });
    trackFirstGame({ mode: gameMode });
    const unsubscribe = engine.subscribe((state) => {
      setEngineState(state);
      if (state.gameOver && state.winner !== null && !gameResultHandledRef.current) {
        gameResultHandledRef.current = true;
        const won = state.winner === localPlayerNumber;
        const reward = won ? potentialReward : Math.floor(potentialReward * 0.1);
        trackEvent(won ? 'game_won' : 'game_lost', {
          mode: gameMode,
          reward,
          foul: state.foul,
        });
        // Guarda resultado pendente para processar quando sessão estiver disponível
        setPendingResult({ won, foul: state.foul, reward });
        // Atualiza economia e stats (sempre disponíveis, não dependem de sessão)
        addCoins(reward);
        addXP(won ? 100 : 25);
        // Modal
        if (won) {
          audioManager.play('win');
          setShowWinModal(true);
        } else {
          audioManager.play('lose');
          setShowLoseModal(true);
        }
      }
    });
    return () => {
      unsubscribe();
      engine.stop();
      setPendingResult(null);
      if (cueStrikeTimeoutRef.current) {
        clearTimeout(cueStrikeTimeoutRef.current);
        cueStrikeTimeoutRef.current = null;
      }
      setCueStrikeActive(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addCoins, addXP, potentialReward, gameMode, localPlayerNumber]);

  // Processa recompensas quando resultado pendente E sessão disponível
  useEffect(() => {
    if (!pendingResult) return;
    const sessionId = sessionRef.current?.user?.id;
    if (!sessionId) {
      console.log('[GameScreen] Pending result but no session yet, waiting... session:', session?.user?.id);
      return;
    }
    const { won, foul, reward } = pendingResult;
    const currentProfile = profileRef.current;

    console.log('[GameScreen] Processing rewards for', sessionId, 'won:', won);

    const currentGameMode = modeType === 'brazilian' ? 'brazilian' : '8ball';

    if (won) {
      // Victory Box
      const winStreak = currentProfile?.stats?.currentWinStreak ?? 0;
      console.log('[GameScreen] Creating victory box — winStreak:', winStreak, 'mode:', currentGameMode);
      createBox(null, winStreak, currentGameMode)
        .then((result) => {
          if (result) {
            console.log('[GameScreen] Victory box created:', result);
          } else {
            console.warn('[GameScreen] Victory box creation returned null');
          }
        })
        .catch((err) => {
          console.error('[GameScreen] Victory box creation failed:', err);
        });

      // Pool Pass Points
      console.log('[GameScreen] Adding Pool Pass points — mode:', currentGameMode, 'result: win');
      addPoolPoints(currentGameMode, 'win').catch((err: Error) => {
        console.error('[GameScreen] Pool Pass points failed:', err);
      });

      // Conquistas permanentes
      achievementWinStreakRef.current += 1;
      const projectedWinStreak = achievementWinStreakRef.current;
      void updateAchievement('first_win').then(showUnlockedAchievement);
      void updateAchievement('total_wins_100').then(showUnlockedAchievement);
      void updateAchievement('total_wins_1000').then(showUnlockedAchievement);
      void updateAchievement('win_streak_3', { value: projectedWinStreak, mode: 'max' }).then(showUnlockedAchievement);
      void updateAchievement('win_streak_10', { value: projectedWinStreak, mode: 'max' }).then(showUnlockedAchievement);

      if (!foul) {
        void updateAchievement('no_foul_win').then(showUnlockedAchievement);
      }
    } else {
      achievementWinStreakRef.current = 0;
    }

    // Missões — atualiza progresso com base no resultado da partida
    // Partidas jogadas (sempre incrementa, vitória ou derrota)
    findAndUpdateMission('daily', 'play_games', 1);
    findAndUpdateMission('weekly', 'play_games', 1);

    // Modo de jogo
    findAndUpdateMission('weekly', 'play_mode', 1);

    // Apenas em caso de vitória
    if (won) {
      // Vitórias
      findAndUpdateMission('daily', 'win_games', 1);
      findAndUpdateMission('weekly', 'win_games', 1);

      // Vitória sem falta
      if (!foul) {
        findAndUpdateMission('daily', 'win_without_foul', 1);
      }

      // Moedas ganhas
      if (reward > 0) {
        findAndUpdateMission('weekly', 'earn_coins', reward);
      }
    }

    // Limpa pendente para não re-executar
    setPendingResult(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResult, createBox, addPoolPoints, findAndUpdateMission, modeType, session?.user?.id, updateAchievement, showUnlockedAchievement]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__gameState = engineState;
    }
  }, [engineState]);

  useEffect(() => {
    const handleTestShoot = (event: Event) => {
      const customEvent = event as CustomEvent<{ power: number; angle: number }>;
      const detail = customEvent.detail;
      if (!detail || typeof detail.power !== 'number' || typeof detail.angle !== 'number') return;
      if (detail.power >= MIN_SHOOT_POWER) {
        engine.shoot(detail.power, detail.angle, { x: 0, y: 0 });
        setPower(0);
        setTimeLeft(30);
        setIsAiming(false);
      }
    };

    window.addEventListener('shoot', handleTestShoot as EventListener);
    return () => {
      window.removeEventListener('shoot', handleTestShoot as EventListener);
    };
  }, [engine]);

  useEffect(() => {
    if (externalTimeLeft !== undefined) return;
    if (!hasEngineState || engineGameOver || engineBallsMoving) return;
    const isTimedPlayerTurn = engineCurrentPlayer === localPlayerNumber;
    if (!isTimedPlayerTurn || engineCurrentPlayer === null || engineTurn === null) return;
    const timeoutTurnKey = `${engineTurn}:${engineCurrentPlayer}`;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (enableLocalTurnTimer && timeoutHandledTurnRef.current !== timeoutTurnKey) {
            timeoutHandledTurnRef.current = timeoutTurnKey;
            engine.timeoutTurn();
            setPower(0);
            setIsAiming(false);
            setShowTimeoutNotice(true);
            window.setTimeout(() => setShowTimeoutNotice(false), 1400);
          }
          return 30;
        }
        if (prev <= 11) {
          playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    engine,
    engineBallsMoving,
    engineCurrentPlayer,
    engineGameOver,
    engineTurn,
    enableLocalTurnTimer,
    externalTimeLeft,
    hasEngineState,
    localPlayerNumber,
  ]);

  // CORREÇÃO LOTE 4: Reseta timer quando turno muda (currentPlayer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasEngineState || externalTimeLeft !== undefined) return;
    timeoutHandledTurnRef.current = null;
    setTimeLeft(30);
  }, [engineCurrentPlayer, engineTurn, externalTimeLeft, hasEngineState]);

  // CORREÇÃO LOTE 4: Reseta timer quando jogada termina (ballsMoving transição)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasEngineState || externalTimeLeft !== undefined) return;
    const wasMoving = previousBallsMovingRef.current;
    previousBallsMovingRef.current = engineBallsMoving;
    if (wasMoving === true && !engineBallsMoving && !engineGameOver) {
      timeoutHandledTurnRef.current = null;
      setTimeLeft(30);
    }
  }, [engineBallsMoving, engineGameOver, externalTimeLeft, hasEngineState]);

  useEffect(() => {
    if (!blockScroll) return;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [blockScroll]);

  const handleAimChange = useCallback((angle: number) => {
    void unlockAudio();
    setAimAngle(angle);
    setIsAiming(true);
    onAimPreview?.(angle, power);
  }, [onAimPreview, power]);

  const handlePowerChange = useCallback((p: number) => {
    void unlockAudio();
    setPower(p);
    onAimPreview?.(aimAngle, p);
  }, [aimAngle, onAimPreview]);

  const handleTableSizeChange = useCallback((nextSize: TableRenderSize) => {
    setTableSize((current) =>
      current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
    );
  }, []);

  const handleShoot = useCallback((shotPower = power) => {
    void unlockAudio();
    if (shotPower >= MIN_SHOOT_POWER) {
      if (engineState?.isBreakShot) {
        audioManager.play('break_shot');
        setShowBreakFlash(true);
        window.setTimeout(() => setShowBreakFlash(false), 150);
      }
      if (customOnShoot) {
        customOnShoot(shotPower, aimAngle);
      } else {
        engine.shoot(shotPower, aimAngle, { x: 0, y: 0 });
      }
      if (shotPower >= 100) {
        void updateAchievement('power_100').then(showUnlockedAchievement);
      }
      setPower(0);
      setTimeLeft(30);
      if (cueStrikeTimeoutRef.current) {
        clearTimeout(cueStrikeTimeoutRef.current);
      }
      setCueStrikeActive(true);
      cueStrikeTimeoutRef.current = window.setTimeout(() => {
        setIsAiming(false);
        setCueStrikeActive(false);
        cueStrikeTimeoutRef.current = null;
      }, 130);
      return;
    } else {
      setPower(0);
    }
    setIsAiming(false);
  }, [power, aimAngle, customOnShoot, engine, updateAchievement, showUnlockedAchievement, engineState?.isBreakShot]);

  const handlePlaceCueBall = useCallback((x: number, y: number) => {
    void unlockAudio();
    engine.placeCueBall(x, y);
  }, [engine]);

  const handleRestartGame = useCallback(() => {
    audioManager.play('ui_click');
    const restartModeType = modeType === 'brazilian' ? 'brazilian' : gameMode;
    const restartMode = currentMode ?? restartModeType;

    gameResultHandledRef.current = false;
    previousBallsMovingRef.current = null;
    timeoutHandledTurnRef.current = null;
    setAimAngle(0);
    setPower(0);
    setIsAiming(false);
    setTimeLeft(30);
    setShowWinModal(false);
    setShowLoseModal(false);
    setMatchStartKey((key) => key + 1);
    engine.reset();
    engine.start();
    startGame(restartMode, restartModeType, entryFee, potentialReward);
  }, [currentMode, engine, entryFee, gameMode, modeType, potentialReward, startGame]);

  useEffect(() => {
    if (showWinModal && isGuest) {
      const shown = localStorage.getItem('guest_win_popup_shown');
      if (!shown) setShowGuestPopup(true);
    }
  }, [showWinModal, isGuest]);

  const handleShare = async () => {
    audioManager.play('ui_click');
    const text = 'Ganhei uma partida de sinuca! 🎱 Joga comigo em 8bollpool.com';
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    void updateAchievement('share_result').then(showUnlockedAchievement);
  };

  if (!engineState) {
    return (
      <div className="game-fullscreen mobile-billiards-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const isLocalPlayerTurn = engineState.currentPlayer === localPlayerNumber;
  const canLocalPlayerAct = isLocalPlayerTurn && !engineState.ballsMoving && !engineState.gameOver;
  const canPlaceCueBall = canLocalPlayerAct && engineState.ballInHand;
  const shouldShowIdleCue = canLocalPlayerAct && !engineState.ballInHand && !isAiming;

  const inputHandlers: InputHandlers = {
    onAimChange: handleAimChange,
    onPowerChange: handlePowerChange,
    onShoot: handleShoot,
    onPlaceCueBall: (x, y) => {
      if (canPlaceCueBall) handlePlaceCueBall(x, y);
    },
    ballInHand: canPlaceCueBall,
    isBreakShot: engineState.isBreakShot,
    aimAngle,
    power,
  };

  return (
    <div className="mobile-billiards-bg h-full min-h-full w-full min-w-0 flex flex-col overflow-hidden relative select-none">
      {header && header(engineState, externalTimeLeft ?? timeLeft)}

      {pocketedRackVariant === 'flow' && (
        <PocketedBallRack balls={engineState.balls} pocketedBallIds={engineState.pocketedBalls} />
      )}
      <GameTutorial />

      <div className="flex-1 min-h-0 min-w-0 relative overflow-visible">
        <MatchTable
          balls={engineState.balls}
          aimAngle={aimAngle}
          power={power}
          isAiming={isAiming && canLocalPlayerAct}
          showIdleCue={shouldShowIdleCue}
          cueStrikeActive={cueStrikeActive}
          isBreakShot={engineState.isBreakShot}
          opponentAim={opponentAim}
          scale={tableScale}
          playerType={isLocalPlayerTurn ? engineState.player1Type : engineState.player2Type}
          gameMode={gameMode}
          tableId={resolvedTableId}
          cueId={resolvedCueId}
          onSizeChange={handleTableSizeChange}
        >
          {overlay && overlay(engineState, inputHandlers)}
        </MatchTable>
      </div>

      <MatchStartAnimation key={matchStartKey} />

      <AnimatePresence>
        {showBreakFlash && (
          <motion.div
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeoutNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-red-400/40 bg-red-950/85 px-5 py-2 text-sm font-black uppercase tracking-wide text-red-100 shadow-lg shadow-red-950/30 backdrop-blur"
          >
            Tempo esgotado!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de ball-in-hand / break shot */}
      {canPlaceCueBall && (
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
      {showBotThinking && engineState.currentPlayer === 2 && !engineState.ballsMoving && !engineState.gameOver && (
        <div className={`${footer ? 'bottom-20' : 'bottom-4'} absolute left-1/2 z-30 -translate-x-1/2`}>
          <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-sm rounded-full border border-slate-700/50 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-300 font-medium">
              {opponent ? `${opponent.name} pensando...` : t('botThinking')}
            </span>
          </div>
        </div>
      )}

      {footer && footer(engineState, power, setPower, handleShoot, tableSize)}

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
                className="flex items-center justify-center gap-2 mb-3"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-sm">$</div>
                <span className="text-3xl font-bold text-amber-400">+{potentialReward.toLocaleString()}</span>
              </motion.div>
              {opponent && (
                <div className="mx-auto mb-5 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${opponent.avatarGradient} text-sm font-black text-white`}>
                    {opponent.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white">
                      {opponent.flag} {opponent.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Nv. {opponent.level} · {opponent.winRate}% win rate · {opponent.wins} vitorias
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestartGame}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl"
                >
                  {opponent ? 'Revanche' : t('playAgain')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    audioManager.play('ui_click');
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
                className="text-slate-400 mb-3"
              >
                Não desista! Tente novamente.
              </motion.p>
              {opponent && (
                <div className="mx-auto mb-5 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${opponent.avatarGradient} text-sm font-black text-white`}>
                    {opponent.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white">
                      {opponent.flag} {opponent.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Nv. {opponent.level} · {opponent.winRate}% win rate · {opponent.wins} vitorias
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestartGame}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl"
                >
                  {opponent ? 'Revanche' : t('tryAgain')}
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

      {/* Achievement Unlock Modal */}
      <AnimatePresence>
        {unlockedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 18 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="w-full max-w-sm rounded-2xl border border-amber-400/40 bg-slate-900 p-6 text-center shadow-2xl shadow-amber-500/10"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
                <Award className="h-8 w-8 text-amber-300" />
              </div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-300">
                Conquista desbloqueada
              </p>
              <h2 className="mb-2 text-xl font-black text-white">{unlockedAchievement.title}</h2>
              <p className="mb-4 text-sm text-slate-400">{unlockedAchievement.description}</p>
              <div className="mb-5 flex flex-wrap justify-center gap-3 text-xs font-bold">
                {unlockedAchievement.rewardCoins > 0 && <span className="text-amber-300">+{unlockedAchievement.rewardCoins} moedas</span>}
                {unlockedAchievement.rewardCash > 0 && <span className="text-cyan-300">+{unlockedAchievement.rewardCash} cash</span>}
                {unlockedAchievement.rewardXp > 0 && <span className="text-violet-300">+{unlockedAchievement.rewardXp} XP</span>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    audioManager.play('coins');
                    void claimAchievement(unlockedAchievement.code).finally(() => setUnlockedAchievement(null));
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white"
                >
                  Coletar
                </button>
                <button
                  onClick={() => {
                    audioManager.play('ui_click');
                    setUnlockedAchievement(null);
                  }}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300"
                >
                  Depois
                </button>
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
                    audioManager.play('ui_click');
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
                    audioManager.play('ui_click');
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
