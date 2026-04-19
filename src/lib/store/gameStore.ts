'use client';

import { create } from 'zustand';

interface GameStore {
  isPlaying: boolean;
  currentMode: string | null;
  modeType: '8ball' | 'brazilian' | 'snooker' | null;
  entryFee: number;
  potentialReward: number;

  // UI / event state only (no ball positions)
  currentPlayer: number;
  player1Type: 'solid' | 'stripe' | null;
  player2Type: 'solid' | 'stripe' | null;
  turn: number;
  gameOver: boolean;
  winner: number | null;
  foul: boolean;
  scratch: boolean;
  ballsMoving: boolean;
  pocketedBalls: number[];
  shots: number;

  startGame: (mode: string, modeType: '8ball' | 'brazilian' | 'snooker', entryFee: number, reward: number) => void;
  endGame: (won: boolean) => void;
  setUIState: (state: Partial<Pick<GameStore, 'currentPlayer' | 'player1Type' | 'player2Type' | 'turn' | 'gameOver' | 'winner' | 'foul' | 'scratch' | 'ballsMoving' | 'pocketedBalls' | 'shots'>>) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isPlaying: false,
  currentMode: null,
  modeType: null,
  entryFee: 0,
  potentialReward: 0,

  currentPlayer: 1,
  player1Type: null,
  player2Type: null,
  turn: 1,
  gameOver: false,
  winner: null,
  foul: false,
  scratch: false,
  ballsMoving: false,
  pocketedBalls: [],
  shots: 0,

  startGame: (mode, modeType, entryFee, reward) =>
    set({
      isPlaying: true,
      currentMode: mode,
      modeType,
      entryFee,
      potentialReward: reward,
      currentPlayer: 1,
      player1Type: null,
      player2Type: null,
      turn: 1,
      gameOver: false,
      winner: null,
      foul: false,
      scratch: false,
      ballsMoving: false,
      pocketedBalls: [],
      shots: 0,
    }),

  endGame: (won) =>
    set((state) => ({
      isPlaying: false,
      gameOver: true,
      winner: won ? 1 : 2,
    })),

  setUIState: (uiState) => set((state) => ({ ...state, ...uiState })),

  reset: () =>
    set({
      isPlaying: false,
      currentMode: null,
      modeType: null,
      entryFee: 0,
      potentialReward: 0,
      currentPlayer: 1,
      player1Type: null,
      player2Type: null,
      turn: 1,
      gameOver: false,
      winner: null,
      foul: false,
      scratch: false,
      ballsMoving: false,
      pocketedBalls: [],
      shots: 0,
    }),
}));
