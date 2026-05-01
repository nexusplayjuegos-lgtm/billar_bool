// src/lib/multiplayer/types.ts

export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';
export type GameMode = '8ball' | 'brazilian' | 'snooker';

export interface Room {
  id: string;
  created_at: string;
  updated_at: string;
  turn_started_at: string | null;
  player_1_id: string;
  player_2_id: string | null;
  status: RoomStatus;
  game_mode: GameMode;
  current_turn: string | null;
  winner_id: string | null;
  bet_coins: number;
}

export interface BallState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  inPocket: boolean;
  rotation: number;
}

export interface RoomShot {
  id: string;
  created_at: string;
  room_id: string;
  player_id: string;
  balls_state: BallState[];
  game_state?: Record<string, unknown> | null;
  aim_angle: number;
  power: number;
  spin_x: number;
  spin_y: number;
  shot_number: number;
}

export interface ShotStart {
  player_id: string;
  aim_angle: number;
  power: number;
  shot_id: string;
}

export interface TurnTimeout {
  player_id: string;
  next_player_id: string;
  timeout_id: string;
}

export interface AimPreview {
  player_id: string;
  aim_angle: number;
  power: number;
  preview_id: string;
}

export interface RoomMessage {
  id: string;
  created_at: string;
  room_id: string;
  player_id: string;
  message: string;
  message_type: 'quick' | 'text' | 'shot_start';
}

export interface MultiplayerState {
  room: Room | null;
  isConnected: boolean;
  isMyTurn: boolean;
  playerNumber: 1 | 2 | null;
  opponentShot: RoomShot | null;
  opponentShotStart: ShotStart | null;
  opponentAim: AimPreview | null;
  turnTimeout: TurnTimeout | null;
  messages: RoomMessage[];
  error: string | null;
}
