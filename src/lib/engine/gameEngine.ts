'use client';

import { Ball } from '@/types';
import { playCueHit, playBallHit, playWallHit, playPocket, playWin, playTurnChange } from '@/lib/audio/gameAudio';
import { getBotDecision, BotDifficulty } from '@/lib/ai/botAI';

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const WALL_LEFT = 28;
const WALL_RIGHT = 772;
const WALL_TOP = 28;
const WALL_BOTTOM = 372;
const FRICTION = 0.985;
const WALL_RESTITUTION = 0.8;
const BALL_RESTITUTION = 0.94;
const STOP_THRESHOLD = 0.05;
const POCKET_RADIUS = 20;
const SHOT_SPEED_SCALE = 0.38;
const COLLISION_PASSES = 4;

const POCKETS = [
  { x: 18, y: 18 },
  { x: TABLE_WIDTH / 2, y: 18 },
  { x: TABLE_WIDTH - 18, y: 18 },
  { x: 18, y: TABLE_HEIGHT - 18 },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 18 },
  { x: TABLE_WIDTH - 18, y: TABLE_HEIGHT - 18 },
];

export interface EngineState {
  balls: Ball[];
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
  ballInHand: boolean;
  isBreakShot: boolean;
  mode: '8ball' | 'brazilian';
  // Sinuca-specific
  player1Points: number;
  player2Points: number;
  maxPoints: number;
}

export type EngineListener = (state: EngineState) => void;

function create8BallBalls(): Ball[] {
  const balls: Ball[] = [];
  balls.push({
    id: 0,
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    radius: 10,
    color: '#FFFFFF',
    inPocket: false,
    rotation: 0,
  });

  const startX = 600;
  const startY = 200;
  const spacing = 20;
  const ballColors = [
    '#FCD34D', '#EF4444', '#3B82F6', '#F59E0B', '#10B981',
    '#8B5CF6', '#F97316', '#000000', '#FCD34D', '#EF4444',
    '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F97316',
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
        rotation: 0,
      });
      ballIndex++;
    }
  }
  return balls;
}

function createBrazilianBalls(): Ball[] {
  return [
    {
      id: 0,
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 10,
      color: '#FFFFFF',
      inPocket: false,
      rotation: 0,
    },
    {
      id: 1,
      x: 400,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 10,
      color: '#EF4444',
      number: 1,
      inPocket: false,
      rotation: 0,
    },
    {
      id: 2,
      x: 600,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 10,
      color: '#FCD34D',
      number: 2,
      inPocket: false,
      rotation: 0,
    },
  ];
}

function createInitialBalls(mode: '8ball' | 'brazilian'): Ball[] {
  return mode === 'brazilian' ? createBrazilianBalls() : create8BallBalls();
}

class GameEngine {
  private state: EngineState;
  private listeners: EngineListener[] = [];
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulated = 0;
  private readonly stepMs = 1000 / 60;
  private pocketedThisTurn: number[] = [];
  private groupsAssigned = false;
  private firstContact: number | null = null;
  // Sinuca-specific tracking
  private redBallContact = false;    // branca encostou na vermelha
  private yellowBallContact = false; // vermelha encostou na amarela
  private redBallPocketed = false;   // vermelha caiu na caçapa
  private mode: '8ball' | 'brazilian' = '8ball';
  private botDifficulty: BotDifficulty = 'medium';
  private multiplayerMode = false;

  constructor(mode: '8ball' | 'brazilian' = '8ball') {
    this.mode = mode;
    this.state = this.createInitialState(mode);
  }

  private createInitialState(mode: '8ball' | 'brazilian'): EngineState {
    return {
      balls: createInitialBalls(mode),
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
      ballInHand: true,
      isBreakShot: true,
      mode,
      player1Points: 0,
      player2Points: 0,
      maxPoints: mode === 'brazilian' ? 10 : 0,
    };
  }

  setMode(mode: '8ball' | 'brazilian') {
    this.mode = mode;
    this.reset();
  }

  setBotDifficulty(difficulty: BotDifficulty) {
    this.botDifficulty = difficulty;
  }

  setMultiplayerMode(enabled: boolean) {
    this.multiplayerMode = enabled;
  }

  applyOpponentShot(angle: number, power: number) {
    // Dispara a tacada do oponente diretamente, sem verificar currentPlayer
    this.shoot(power, angle, { x: 0, y: 0 });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulated = 0;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.botTimeout) clearTimeout(this.botTimeout);
    if (this.botSafetyTimeout) clearTimeout(this.botSafetyTimeout);
  }

  reset() {
    this.stop();
    this.state = this.createInitialState(this.mode);
    this.pocketedThisTurn = [];
    this.groupsAssigned = false;
    this.firstContact = null;
    this.redBallContact = false;
    this.yellowBallContact = false;
    this.redBallPocketed = false;
    this.emit();
  }

  shoot(power: number, angle: number, _spin: { x: number; y: number }) {
    if (this.state.gameOver || this.state.ballsMoving) return;
    const cueBall = this.state.balls[0];
    if (!cueBall || cueBall.inPocket) return;

    const speed = power * SHOT_SPEED_SCALE;
    cueBall.vx = Math.cos(angle) * speed;
    cueBall.vy = Math.sin(angle) * speed;
    this.state.shots += 1;
    this.pocketedThisTurn = [];
    this.firstContact = null;
    this.redBallContact = false;
    this.yellowBallContact = false;
    this.redBallPocketed = false;
    this.state.foul = false;
    this.state.scratch = false;
    this.state.ballInHand = false;
    this.state.isBreakShot = false;
    playCueHit(power);
    this.emit();
  }

  placeCueBall(x: number, y: number) {
    const cueBall = this.state.balls[0];
    if (!cueBall) return;
    const margin = 5;
    let clampedX = Math.max(WALL_LEFT + margin, Math.min(WALL_RIGHT - margin, x));
    const clampedY = Math.max(WALL_TOP + margin, Math.min(WALL_BOTTOM - margin, y));

    if (this.state.isBreakShot) {
      clampedX = Math.min(clampedX, 200 - margin);
    }

    cueBall.x = clampedX;
    cueBall.y = clampedY;
    cueBall.vx = 0;
    cueBall.vy = 0;
    cueBall.inPocket = false;
    this.state.ballInHand = false;
    this.emit();
  }

  timeoutTurn() {
    if (this.state.gameOver || this.state.ballsMoving) return;
    this.state.foul = true;
    this.state.ballInHand = true;
    this.switchTurn();
  }

  setMultiplayerTurn(playerNumber: 1 | 2, options: { ballInHand?: boolean; foul?: boolean } = {}) {
    if (this.state.gameOver || this.state.ballsMoving) return;

    const changedPlayer = this.state.currentPlayer !== playerNumber;
    this.state.currentPlayer = playerNumber;
    if (changedPlayer) {
      this.state.turn += 1;
    }
    if (options.ballInHand !== undefined) {
      this.state.ballInHand = options.ballInHand;
    }
    if (options.foul !== undefined) {
      this.state.foul = options.foul;
    }

    this.pocketedThisTurn = [];
    this.firstContact = null;
    this.redBallContact = false;
    this.yellowBallContact = false;
    this.redBallPocketed = false;
    if (changedPlayer) {
      playTurnChange();
    }
    this.emit();
  }

  getState(): EngineState {
    return {
      ...this.state,
      balls: this.state.balls.map((b) => ({ ...b })),
    };
  }

  applyRemoteState(remoteState: Partial<EngineState>) {
    this.state = {
      ...this.state,
      ...remoteState,
      balls: remoteState.balls
        ? remoteState.balls.map((b) => ({ ...b, vx: 0, vy: 0 }))
        : this.state.balls.map((b) => ({ ...b })),
      ballsMoving: false,
    };
    this.groupsAssigned = !!this.state.player1Type && !!this.state.player2Type;
    this.pocketedThisTurn = [];
    this.firstContact = null;
    this.redBallContact = false;
    this.yellowBallContact = false;
    this.redBallPocketed = false;
    this.emit();
  }

  subscribe(listener: EngineListener) {
    this.listeners.push(listener);
    listener({ ...this.state, balls: this.state.balls.map((b) => ({ ...b })) });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    const snapshot = {
      ...this.state,
      balls: this.state.balls.map((b) => ({ ...b })),
    };
    this.listeners.forEach((l) => l(snapshot));
  }

  private loop(now: number) {
    if (!this.running) return;
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.accumulated += Math.min(dt, 50);

    while (this.accumulated >= this.stepMs) {
      this.step();
      this.accumulated -= this.stepMs;
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private step() {
    if (this.state.gameOver) return;

    let anyMoving = false;
    const previousPositions = new Map<number, { x: number; y: number }>();
    this.state.balls.forEach((ball) => {
      previousPositions.set(ball.id, { x: ball.x, y: ball.y });
    });

    for (const ball of this.state.balls) {
      if (ball.inPocket) continue;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Rotação realista de rolamento: a bola gira uma volta (2π)
      // para cada circunferência percorrida (2π × radius).
      // A marca na superfície visível se move no sentido CONTRÁRIO
      // ao movimento da bola (rolling without slipping).
      const distance = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (distance > 0.001) {
        ball.rotation -= distance / ball.radius;
      }

      if (Math.abs(ball.vx) < STOP_THRESHOLD) ball.vx = 0;
      if (Math.abs(ball.vy) < STOP_THRESHOLD) ball.vy = 0;
      if (ball.vx !== 0 || ball.vy !== 0) anyMoving = true;
    }

    let wallHit = false;
    for (const ball of this.state.balls) {
      if (ball.inPocket) continue;
      if (ball.x < WALL_LEFT) {
        ball.vx = -ball.vx * WALL_RESTITUTION;
        ball.x = WALL_LEFT;
        wallHit = true;
      } else if (ball.x > WALL_RIGHT) {
        ball.vx = -ball.vx * WALL_RESTITUTION;
        ball.x = WALL_RIGHT;
        wallHit = true;
      }
      if (ball.y < WALL_TOP) {
        ball.vy = -ball.vy * WALL_RESTITUTION;
        ball.y = WALL_TOP;
        wallHit = true;
      } else if (ball.y > WALL_BOTTOM) {
        ball.vy = -ball.vy * WALL_RESTITUTION;
        ball.y = WALL_BOTTOM;
        wallHit = true;
      }
    }
    if (wallHit) {
      playWallHit();
    }

    const balls = this.state.balls;
    for (let pass = 0; pass < COLLISION_PASSES; pass++) {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        if (a.inPocket || b.inPocket) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        if (pass === 0 && dist >= minDist) {
          const prevA = previousPositions.get(a.id) ?? a;
          const prevB = previousPositions.get(b.id) ?? b;
          const relStartX = prevB.x - prevA.x;
          const relStartY = prevB.y - prevA.y;
          const relMoveX = (b.x - prevB.x) - (a.x - prevA.x);
          const relMoveY = (b.y - prevB.y) - (a.y - prevA.y);
          const relMoveLenSq = relMoveX * relMoveX + relMoveY * relMoveY;

          if (relMoveLenSq > 0) {
            const t = Math.max(
              0,
              Math.min(1, -((relStartX * relMoveX + relStartY * relMoveY) / relMoveLenSq))
            );
            const closestX = relStartX + relMoveX * t;
            const closestY = relStartY + relMoveY * t;
            const closestDist = Math.sqrt(closestX * closestX + closestY * closestY);

            if (closestDist < minDist && closestDist > 0) {
              a.x = prevA.x + (a.x - prevA.x) * t;
              a.y = prevA.y + (a.y - prevA.y) * t;
              b.x = prevB.x + (b.x - prevB.x) * t;
              b.y = prevB.y + (b.y - prevB.y) * t;
              dx = closestX;
              dy = closestY;
              dist = closestDist;
            }
          }
        }

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const aNormal = a.vx * nx + a.vy * ny;
          const bNormal = b.vx * nx + b.vy * ny;
          const normalDelta = aNormal - bNormal;
          if (normalDelta <= 0) continue;

          const transfer = normalDelta * BALL_RESTITUTION;
          a.vx -= transfer * nx;
          a.vy -= transfer * ny;
          b.vx += transfer * nx;
          b.vy += transfer * ny;
          const impactIntensity = Math.abs(normalDelta) / 8;
          if (pass === 0 && impactIntensity > 0.05) {
            playBallHit(Math.min(impactIntensity, 1));
          }

          // Track contacts for rules
          if (this.firstContact === null) {
            if (a.id === 0) this.firstContact = b.id;
            else if (b.id === 0) this.firstContact = a.id;
          }
          // Sinuca: track red ball contact (white → red)
          if (this.mode === 'brazilian') {
            if ((a.id === 0 && b.id === 1) || (a.id === 1 && b.id === 0)) {
              this.redBallContact = true;
            }
            // Sinuca: track yellow ball contact (red → yellow)
            if ((a.id === 1 && b.id === 2) || (a.id === 2 && b.id === 1)) {
              this.yellowBallContact = true;
            }
          }
        }
      }
    }
    }

    for (const ball of this.state.balls) {
      if (ball.inPocket) continue;
      for (const pocket of POCKETS) {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
          ball.inPocket = true;
          ball.vx = 0;
          ball.vy = 0;
          this.pocketedThisTurn.push(ball.id);
          if (!this.state.pocketedBalls.includes(ball.id)) {
            this.state.pocketedBalls.push(ball.id);
          }
          if (this.mode === 'brazilian' && ball.id === 1) {
            this.redBallPocketed = true;
          }
          playPocket();
          break;
        }
      }
    }

    const wasMoving = this.state.ballsMoving;
    this.state.ballsMoving = anyMoving;

    if (wasMoving && !anyMoving) {
      if (this.mode === 'brazilian') {
        this.applyBrazilianRules();
      } else {
        this.apply8BallRules();
      }
      if (!this.state.gameOver && this.state.currentPlayer === 2) {
        this.scheduleBotPlay();
      }
    }

    if (anyMoving || wasMoving !== anyMoving || this.pocketedThisTurn.length > 0) {
      this.emit();
    }
  }

  // ===== 8-BALL RULES =====
  private apply8BallRules() {
    if (this.state.gameOver) return;

    const cueBall = this.state.balls[0];
    const player = this.state.currentPlayer;

    if (cueBall.inPocket) {
      this.state.scratch = true;
      this.state.foul = true;
      cueBall.inPocket = false;
      cueBall.x = 200;
      cueBall.y = 200;
      cueBall.vx = 0;
      cueBall.vy = 0;
      this.state.ballInHand = true;
      this.switchTurn();
      return;
    }

    if (this.firstContact === null) {
      this.state.foul = false;
      this.state.ballInHand = false;
      this.switchTurn();
      return;
    }

    if (this.groupsAssigned) {
      const firstBall = this.state.balls.find((b) => b.id === this.firstContact);
      const playerGroup = player === 1 ? this.state.player1Type : this.state.player2Type;
      if (firstBall && firstBall.number && firstBall.number !== 8 && playerGroup) {
        const isOwnGroup =
          (playerGroup === 'solid' && firstBall.number <= 7) ||
          (playerGroup === 'stripe' && firstBall.number >= 9);
        if (!isOwnGroup) {
          this.state.foul = true;
          this.state.ballInHand = true;
          this.switchTurn();
          return;
        }
      }
    }

    const eight = this.state.balls.find((b) => b.number === 8);
    if (eight && eight.inPocket) {
      const playerGroup = player === 1 ? this.state.player1Type : this.state.player2Type;
      const groupBalls = this.state.balls.filter(
        (b) =>
          !b.inPocket &&
          b.number !== 0 &&
          b.number !== 8 &&
          ((playerGroup === 'solid' && b.number && b.number <= 7) ||
            (playerGroup === 'stripe' && b.number && b.number >= 9))
      );
      if (groupBalls.length === 0) {
        this.state.winner = player;
      } else {
        this.state.winner = player === 1 ? 2 : 1;
      }
      this.state.gameOver = true;
      playWin();
      return;
    }

    if (!this.groupsAssigned) {
      const pocketedSolid = this.pocketedThisTurn.some((id) => {
        const b = this.state.balls.find((x) => x.id === id);
        return b && b.number && b.number >= 1 && b.number <= 7;
      });
      const pocketedStripe = this.pocketedThisTurn.some((id) => {
        const b = this.state.balls.find((x) => x.id === id);
        return b && b.number && b.number >= 9 && b.number <= 15;
      });
      if (pocketedSolid || pocketedStripe) {
        if (pocketedSolid && !pocketedStripe) {
          this.state.player1Type = 'solid';
          this.state.player2Type = 'stripe';
        } else if (pocketedStripe && !pocketedSolid) {
          this.state.player1Type = 'stripe';
          this.state.player2Type = 'solid';
        } else {
          const first = this.pocketedThisTurn.find((id) => {
            const b = this.state.balls.find((x) => x.id === id);
            return b && b.number && b.number !== 8;
          });
          const b = this.state.balls.find((x) => x.id === first);
          if (b && b.number && b.number <= 7) {
            this.state.player1Type = 'solid';
            this.state.player2Type = 'stripe';
          } else {
            this.state.player1Type = 'stripe';
            this.state.player2Type = 'solid';
          }
        }
        this.groupsAssigned = true;
      }
    }

    const playerGroup = player === 1 ? this.state.player1Type : this.state.player2Type;
    let keptTurn = false;
    if (this.groupsAssigned && playerGroup) {
      keptTurn = this.pocketedThisTurn.some((id) => {
        const b = this.state.balls.find((x) => x.id === id);
        if (!b || !b.number || b.number === 8) return false;
        if (playerGroup === 'solid') return b.number <= 7;
        return b.number >= 9;
      });
    }

    if (!keptTurn) {
      this.state.ballInHand = false;
      this.switchTurn();
    }
  }

  // ===== BRAZILIAN RULES =====
  private applyBrazilianRules() {
    if (this.state.gameOver) return;

    const cueBall = this.state.balls[0];
    const player = this.state.currentPlayer;
    let pointsEarned = 0;
    let keptTurn = false;

    // 1. Branca na caçapa = falta, ball-in-hand adversário
    if (cueBall.inPocket) {
      this.state.scratch = true;
      this.state.foul = true;
      cueBall.inPocket = false;
      cueBall.x = 200;
      cueBall.y = 200;
      cueBall.vx = 0;
      cueBall.vy = 0;
      this.state.ballInHand = true;
      this.switchTurn();
      return;
    }

    // 2. Não encostou na vermelha = falta, passa vez
    if (!this.redBallContact) {
      this.state.foul = true;
      this.switchTurn();
      return;
    }

    // 3. Vermelha caiu na caçapa = 2 pontos (boca)
    if (this.redBallPocketed) {
      pointsEarned += 2;
      // Respawn vermelha no centro
      const redBall = this.state.balls.find((b) => b.id === 1);
      if (redBall) {
        redBall.inPocket = false;
        redBall.x = 400;
        redBall.y = 200;
        redBall.vx = 0;
        redBall.vy = 0;
      }
      keptTurn = true;
    }

    // 4. Vermelha encostou na amarela = 1 ponto
    if (this.yellowBallContact) {
      pointsEarned += 1;
      keptTurn = true;
    }

    // Aplicar pontos
    if (pointsEarned > 0) {
      if (player === 1) {
        this.state.player1Points += pointsEarned;
      } else {
        this.state.player2Points += pointsEarned;
      }
    }

    // 5. Verificar vitória (10 pontos)
    if (this.state.player1Points >= this.state.maxPoints) {
      this.state.winner = 1;
      this.state.gameOver = true;
      playWin();
      return;
    }
    if (this.state.player2Points >= this.state.maxPoints) {
      this.state.winner = 2;
      this.state.gameOver = true;
      playWin();
      return;
    }

    // 6. Sem pontos = passa vez
    if (!keptTurn) {
      this.switchTurn();
    }
  }

  // ===== BOT PLAYER =====
  private botTimeout = 0;
  private botSafetyTimeout = 0;

  private scheduleBotPlay() {
    if (this.multiplayerMode) return;
    if (this.botTimeout) clearTimeout(this.botTimeout);
    if (this.botSafetyTimeout) clearTimeout(this.botSafetyTimeout);
    const delay = 1500 + Math.random() * 1500;
    this.botTimeout = window.setTimeout(() => this.botPlay(), delay);
    // Safety timeout: force a shot if bot hasn't played in 8 seconds
    this.botSafetyTimeout = window.setTimeout(() => {
      if (!this.state.gameOver && this.state.currentPlayer === 2 && !this.state.ballsMoving) {
        console.warn('Bot safety timeout triggered');
        const cueBall = this.state.balls[0];
        if (cueBall && !cueBall.inPocket) {
          this.shoot(40, Math.random() * Math.PI * 2, { x: 0, y: 0 });
        }
      }
    }, 8000);
  }

  private botPlay() {
    if (this.multiplayerMode) return;
    if (this.state.gameOver || this.state.ballsMoving || this.state.currentPlayer !== 2) return;

    const cueBall = this.state.balls[0];
    if (!cueBall || cueBall.inPocket) return;

    // Ball-in-hand: posiciona a bola branca
    if (this.state.ballInHand) {
      if (this.mode === 'brazilian') {
        const redBall = this.state.balls.find((b) => b.id === 1);
        if (redBall && !redBall.inPocket) {
          const offsetX = (Math.random() - 0.5) * 100;
          const offsetY = (Math.random() - 0.5) * 100;
          this.placeCueBall(
            Math.max(WALL_LEFT + 10, Math.min(WALL_RIGHT - 10, redBall.x - 80 + offsetX)),
            Math.max(WALL_TOP + 10, Math.min(WALL_BOTTOM - 10, redBall.y + offsetY))
          );
          // Schedule the actual shot after placing
          this.scheduleBotPlay();
          return;
        }
      } else {
        this.placeCueBall(200 + Math.random() * 100, 150 + Math.random() * 100);
        // Schedule the actual shot after placing
        this.scheduleBotPlay();
        return;
      }
    }

    try {
      const decision = getBotDecision(
        this.state.balls,
        cueBall,
        this.botDifficulty,
        this.mode,
        POCKETS,
        this.state.player2Type,
        this.groupsAssigned
      );
      this.shoot(decision.power, decision.angle, { x: 0, y: 0 });
    } catch (error) {
      console.error('Bot error:', error);
      // Fallback: taca em direção aleatória
      const randomAngle = Math.random() * Math.PI * 2;
      this.shoot(40, randomAngle, { x: 0, y: 0 });
    }
  }

  private switchTurn() {
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
    this.state.turn += 1;
    this.pocketedThisTurn = [];
    this.firstContact = null;
    this.redBallContact = false;
    this.yellowBallContact = false;
    this.redBallPocketed = false;
    playTurnChange();
  }
}

// Singleton legado para singleplayer (mantido para compatibilidade)
export const gameEngine = new GameEngine('8ball');

// Factory function — cria uma nova instância a cada partida (multiplayer)
export function createGameEngine(mode: '8ball' | 'brazilian' = '8ball'): GameEngine {
  return new GameEngine(mode);
}
