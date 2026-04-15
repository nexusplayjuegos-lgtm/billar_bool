'use client';

import { create } from 'zustand';
import { GameState, Ball } from '@/types';

interface GameStore {
  gameState: GameState | null;
  isPlaying: boolean;
  currentMode: string | null;
  entryFee: number;
  potentialReward: number;

  // Actions
  startGame: (mode: string, entryFee: number, reward: number) => void;
  endGame: (won: boolean) => void;
  updateGameState: (state: Partial<GameState>) => void;
  shoot: (power: number, angle: number, spin: { x: number; y: number }) => void;
  reset: () => void;
}

const createInitialBalls = (): Ball[] => {
  const balls: Ball[] = [];

  // Bola branca (cue ball)
  balls.push({
    id: 0,
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    radius: 10,
    color: '#FFFFFF',
    inPocket: false,
  });

  // Bolas numeradas (triângulo)
  const startX = 600;
  const startY = 200;
  const spacing = 20;

  const ballColors = [
    '#FCD34D', '#EF4444', '#3B82F6', '#F59E0B', '#10B981',
    '#8B5CF6', '#F97316', '#000000', '#FCD34D', '#EF4444',
    '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F97316'
  ];

  let ballIndex = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      balls.push({
        id: ballIndex + 1,
        x: startX + row * spacing * 0.866,
        y: startY + (col - row / 2) * spacing,
        vx: 0,
        vy: 0,
        radius: 10,
        color: ballColors[ballIndex],
        number: ballIndex + 1,
        isStriped: ballIndex >= 7 && ballIndex < 14,
        inPocket: false,
      });
      ballIndex++;
    }
  }

  return balls;
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isPlaying: false,
  currentMode: null,
  entryFee: 0,
  potentialReward: 0,

  startGame: (mode, entryFee, reward) =>
    set({
      isPlaying: true,
      currentMode: mode,
      entryFee,
      potentialReward: reward,
      gameState: {
        balls: createInitialBalls(),
        currentPlayer: 1,
        player1Type: null,
        player2Type: null,
        turn: 1,
        gameOver: false,
        winner: null,
        foul: false,
        scratch: false,
        shots: 0,
      },
    }),

  endGame: (won) =>
    set((state) => ({
      isPlaying: false,
      gameState: state.gameState
        ? { ...state.gameState, gameOver: true, winner: won ? 1 : 2 }
        : null,
    })),

  updateGameState: (newState) =>
    set((state) => ({
      gameState: state.gameState
        ? { ...state.gameState, ...newState }
        : null,
    })),

  shoot: (power, angle, spin) =>
    set((state) => {
      if (!state.gameState) return state;

      const cueBall = state.gameState.balls[0];
      const vx = Math.cos(angle) * power * 0.3;
      const vy = Math.sin(angle) * power * 0.3;

      const newBalls = [...state.gameState.balls];
      newBalls[0] = { ...cueBall, vx: vx + spin.x * 0.1, vy: vy + spin.y * 0.1 };

      return {
        gameState: {
          ...state.gameState,
          balls: newBalls,
          shots: state.gameState.shots + 1,
        },
      };
    }),

  reset: () =>
    set({
      gameState: null,
      isPlaying: false,
      currentMode: null,
      entryFee: 0,
      potentialReward: 0,
    }),
}));
