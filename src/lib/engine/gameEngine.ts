'use client';

import { Ball } from '@/types';
import { playCueHit, playBallHit, playWallHit, playPocket, playWin, playTurnChange } from '@/lib/audio/gameAudio';

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const WALL_LEFT = 28;
const WALL_RIGHT = 772;
const WALL_TOP = 28;
const WALL_BOTTOM = 372;
const FRICTION = 0.985;
const WALL_RESTITUTION = 0.8;
const BALL_RESTITUTION = 0.9;
const STOP_THRESHOLD = 0.05;
const POCKET_RADIUS = 20;

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
}

export type EngineListener = (state: EngineState) => void;

function createInitialBalls(): Ball[] {
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
  private firstContact: number | null = null; // id da primeira bola tocada na tacada

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineState {
    return {
      balls: createInitialBalls(),
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
      ballInHand: false,
    };
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
  }

  reset() {
    this.stop();
    this.state = this.createInitialState();
    this.pocketedThisTurn = [];
    this.groupsAssigned = false;
    this.emit();
  }

  shoot(power: number, angle: number, _spin: { x: number; y: number }) {
    if (this.state.gameOver || this.state.ballsMoving) return;
    const cueBall = this.state.balls[0];
    if (!cueBall || cueBall.inPocket) return;

    const speed = power * 0.3;
    cueBall.vx = Math.cos(angle) * speed;
    cueBall.vy = Math.sin(angle) * speed;
    this.state.shots += 1;
    this.pocketedThisTurn = [];
    this.firstContact = null;
    this.state.foul = false;
    this.state.scratch = false;
    this.state.ballInHand = false;
    playCueHit(power);
    this.emit();
  }

  placeCueBall(x: number, y: number) {
    const cueBall = this.state.balls[0];
    if (!cueBall) return;
    cueBall.x = Math.max(WALL_LEFT + 10, Math.min(WALL_RIGHT - 10, x));
    cueBall.y = Math.max(WALL_TOP + 10, Math.min(WALL_BOTTOM - 10, y));
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

    for (const ball of this.state.balls) {
      if (ball.inPocket) continue;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Atualiza rotação visual proporcional à velocidade
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > 0.01) {
        ball.rotation += speed * 0.15;
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
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        if (a.inPocket || b.inPocket) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const dvx = b.vx - a.vx;
          const dvy = b.vy - a.vy;
          const velAlongNormal = dvx * nx + dvy * ny;
          if (velAlongNormal > 0) continue;

          const impulse = (-(1 + BALL_RESTITUTION) * velAlongNormal) / 2;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
          const impactIntensity = Math.abs(velAlongNormal) / 8;
          if (impactIntensity > 0.05) {
            playBallHit(Math.min(impactIntensity, 1));
          }

          // Registra primeira bola tocada pela bola branca
          if (this.firstContact === null) {
            if (a.id === 0) this.firstContact = b.id;
            else if (b.id === 0) this.firstContact = a.id;
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
          playPocket();
          break;
        }
      }
    }

    const wasMoving = this.state.ballsMoving;
    this.state.ballsMoving = anyMoving;

    if (wasMoving && !anyMoving) {
      this.applyRules();
      // Se passou para a vez do bot, inicia jogada do bot
      if (!this.state.gameOver && this.state.currentPlayer === 2) {
        this.scheduleBotPlay();
      }
    }

    // BUG FIX: emitir a cada frame enquanto as bolas estiverem se movendo
    // para que o React possa re-renderizar a mesa em tempo real.
    if (anyMoving || wasMoving !== anyMoving || this.pocketedThisTurn.length > 0) {
      this.emit();
    }
  }

  private applyRules() {
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

    // Verifica se a bola branca tocou alguma bola
    if (this.firstContact === null) {
      // Não tocou em nenhuma bola = falta
      this.state.foul = true;
      this.state.ballInHand = true;
      this.switchTurn();
      return;
    }

    // Verifica se a primeira bola tocada pertence ao grupo do jogador
    if (this.groupsAssigned) {
      const firstBall = this.state.balls.find((b) => b.id === this.firstContact);
      const playerGroup = player === 1 ? this.state.player1Type : this.state.player2Type;
      if (firstBall && firstBall.number && firstBall.number !== 8 && playerGroup) {
        const isOwnGroup =
          (playerGroup === 'solid' && firstBall.number <= 7) ||
          (playerGroup === 'stripe' && firstBall.number >= 9);
        if (!isOwnGroup) {
          // Toque na bola do adversário primeiro = falta
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
      this.state.ballInHand = true;
      this.switchTurn();
    }
  }

  // ===== BOT PLAYER =====
  private botTimeout = 0;

  private scheduleBotPlay() {
    if (this.botTimeout) clearTimeout(this.botTimeout);
    const delay = 1500 + Math.random() * 1500;
    this.botTimeout = window.setTimeout(() => this.botPlay(), delay);
  }

  private botPlay() {
    if (this.state.gameOver || this.state.ballsMoving || this.state.currentPlayer !== 2) return;

    const cueBall = this.state.balls[0];
    if (!cueBall || cueBall.inPocket) return;

    // Identifica bolas alvo válidas para o bot
    const botGroup = this.state.player2Type;
    let targets = this.state.balls.filter((b) => {
      if (b.id === 0 || b.inPocket) return false;
      if (!this.groupsAssigned) return true; // Pode atacar qualquer uma
      if (b.number === 8) {
        // Só atacar 8 se já derrubou todas do grupo
        const groupBalls = this.state.balls.filter(
          (x) =>
            !x.inPocket &&
            x.number !== 0 &&
            x.number !== 8 &&
            ((botGroup === 'solid' && x.number && x.number <= 7) ||
              (botGroup === 'stripe' && x.number && x.number >= 9))
        );
        return groupBalls.length === 0;
      }
      if (botGroup === 'solid') return b.number && b.number <= 7;
      if (botGroup === 'stripe') return b.number && b.number >= 9;
      return true;
    });

    if (targets.length === 0) {
      // Sem alvos, taca em qualquer direção aleatória
      const randomAngle = Math.random() * Math.PI * 2;
      this.shoot(40 + Math.random() * 30, randomAngle, { x: 0, y: 0 });
      return;
    }

    // Ordena alvos por proximidade
    targets.sort((a, b) => {
      const da = Math.sqrt((a.x - cueBall.x) ** 2 + (a.y - cueBall.y) ** 2);
      const db = Math.sqrt((b.x - cueBall.x) ** 2 + (b.y - cueBall.y) ** 2);
      return da - db;
    });

    // Tenta os 3 alvos mais próximos
    for (let i = 0; i < Math.min(3, targets.length); i++) {
      const target = targets[i];
      const dx = target.x - cueBall.x;
      const dy = target.y - cueBall.y;
      const baseAngle = Math.atan2(dy, dx);

      // Erro aleatório baseado na "dificuldade" (80% precisão)
      const error = (Math.random() - 0.5) * 0.12;
      const angle = baseAngle + error;

      // Potência baseada na distância (mais perto = menos potência)
      const dist = Math.sqrt(dx * dx + dy * dy);
      const basePower = Math.min(30 + dist * 0.15, 85);
      const powerVariation = (Math.random() - 0.5) * 10;
      const power = Math.min(Math.max(basePower + powerVariation, 25), 90);

      // Verifica se não vai dar scratch (bola branca na caçapa)
      // Simplificado: se o ângulo aponta para longe das caçapas, aceita
      const safe = this.isSafeAngle(cueBall, angle);
      if (safe || i === targets.length - 1) {
        this.shoot(power, angle, { x: 0, y: 0 });
        return;
      }
    }

    // Fallback: taca no alvo mais próximo
    const closest = targets[0];
    const angle = Math.atan2(closest.y - cueBall.y, closest.x - cueBall.x);
    this.shoot(50, angle, { x: 0, y: 0 });
  }

  private isSafeAngle(cueBall: Ball, angle: number): boolean {
    // Verifica se a direção não aponta diretamente para uma caçapa
    for (const pocket of POCKETS) {
      const dx = pocket.x - cueBall.x;
      const dy = pocket.y - cueBall.y;
      const pocketAngle = Math.atan2(dy, dx);
      const diff = Math.abs(((pocketAngle - angle + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (diff < 0.3) return false;
    }
    return true;
  }

  private switchTurn() {
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
    this.state.turn += 1;
    this.pocketedThisTurn = [];
    this.firstContact = null;
    playTurnChange();
  }
}

export const gameEngine = new GameEngine();
