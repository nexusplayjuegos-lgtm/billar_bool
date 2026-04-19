'use client';

import { Ball } from '@/types';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface Pocket {
  x: number;
  y: number;
}

const BALL_RADIUS = 10;

function hasClearPath(from: Ball, to: Ball, allBalls: Ball[]): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return true;
  const steps = Math.max(3, Math.floor(dist / 5));

  for (let i = 1; i < steps; i++) {
    const checkX = from.x + (dx / steps) * i;
    const checkY = from.y + (dy / steps) * i;
    for (const ball of allBalls) {
      if (ball.id === from.id || ball.id === to.id || ball.inPocket) continue;
      const bdx = ball.x - checkX;
      const bdy = ball.y - checkY;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < BALL_RADIUS * 2.2) {
        return false;
      }
    }
  }
  return true;
}

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getEasiestShot(targets: Ball[], cueBall: Ball): Ball {
  return targets.reduce((best, ball) => {
    const bestDist = getDistance(best, cueBall);
    const ballDist = getDistance(ball, cueBall);
    return ballDist < bestDist ? ball : best;
  }, targets[0]);
}

function getBestPocketShot(
  targets: Ball[],
  cueBall: Ball,
  allBalls: Ball[],
  pockets: Pocket[]
): { target: Ball; angle: number; power: number } | null {
  let best: { target: Ball; angle: number; power: number; score: number } | null = null;

  for (const target of targets) {
    for (const pocket of pockets) {
      // Ângulo para a caçapa a partir da bola alvo
      const pocketAngle = Math.atan2(pocket.y - target.y, pocket.x - target.x);
      // Posição da ghost ball (bola branca na colisão)
      const ghostX = target.x - Math.cos(pocketAngle) * (BALL_RADIUS * 2);
      const ghostY = target.y - Math.sin(pocketAngle) * (BALL_RADIUS * 2);
      // Verificar se a ghost ball é alcançável da posição atual da branca
      const ghostBall: Ball = {
        id: -1,
        x: ghostX,
        y: ghostY,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '',
        inPocket: false,
        rotation: 0,
      };
      if (!hasClearPath(cueBall, ghostBall, allBalls)) continue;
      // Verificar se a bola alvo tem caminho livre até a caçapa
      const targetToPocket: Ball = {
        id: -2,
        x: pocket.x,
        y: pocket.y,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '',
        inPocket: false,
        rotation: 0,
      };
      if (!hasClearPath(target, targetToPocket, allBalls.filter((b) => b.id !== target.id))) continue;

      const angle = Math.atan2(ghostY - cueBall.y, ghostX - cueBall.x);
      const dist = getDistance(cueBall, ghostBall);
      const power = Math.min(85, Math.max(30, dist * 0.25 + 20));
      const score = 1000 - dist - getDistance(target, pocket) * 0.5;

      if (!best || score > best.score) {
        best = { target, angle, power, score };
      }
    }
  }

  return best ? { target: best.target, angle: best.angle, power: best.power } : null;
}

export interface BotDecision {
  angle: number;
  power: number;
}

export function getBotDecision(
  balls: Ball[],
  cueBall: Ball,
  difficulty: BotDifficulty,
  mode: '8ball' | 'brazilian',
  pockets: Pocket[],
  player2Type?: 'solid' | 'stripe' | null,
  groupsAssigned?: boolean
): BotDecision {
  if (!cueBall || cueBall.inPocket) {
    return { angle: 0, power: 30 };
  }

  const activeBalls = balls.filter((b) => !b.inPocket);

  // ===== SINUCA BRASILEIRA =====
  if (mode === 'brazilian') {
    const redBall = activeBalls.find((b) => b.id === 1);
    const yellowBall = activeBalls.find((b) => b.id === 2);
    if (!redBall) {
      return { angle: Math.random() * Math.PI * 2, power: 30 + Math.random() * 40 };
    }

    // Easy: mira direto na vermelha com erro grande
    if (difficulty === 'easy') {
      const angle = Math.atan2(redBall.y - cueBall.y, redBall.x - cueBall.x);
      const error = (Math.random() - 0.5) * 0.35; // ±20°
      return { angle: angle + error, power: 40 + Math.random() * 30 };
    }

    // Medium/Hard: tenta mirar na vermelha considerando a amarela
    let targetAngle = Math.atan2(redBall.y - cueBall.y, redBall.x - cueBall.x);
    let power = Math.min(80, Math.max(35, getDistance(cueBall, redBall) * 0.3));

    // Se existe bola amarela, tenta ângulo que a vermelha vá em direção a ela
    if (yellowBall && (difficulty === 'hard' || Math.random() > 0.5)) {
      const yellowAngle = Math.atan2(yellowBall.y - redBall.y, yellowBall.x - redBall.x);
      // Ajusta ligeiramente o ângulo de approach para que a vermelha vá em direção à amarela
      const approachOffset = (yellowAngle - targetAngle) * 0.15;
      targetAngle += approachOffset;
    }

    const error = difficulty === 'hard' ? (Math.random() - 0.5) * 0.04 : (Math.random() - 0.5) * 0.12;
    return { angle: targetAngle + error, power };
  }

  // ===== 8-BALL =====
  let targets = activeBalls.filter((b) => {
    if (b.id === 0) return false;
    if (!groupsAssigned) return true;
    if (b.number === 8) {
      const groupBalls = activeBalls.filter(
        (x) =>
          x.id !== 0 &&
          x.number !== 8 &&
          ((player2Type === 'solid' && x.number && x.number <= 7) ||
            (player2Type === 'stripe' && x.number && x.number >= 9))
      );
      return groupBalls.length === 0;
    }
    if (player2Type === 'solid') return b.number && b.number <= 7;
    if (player2Type === 'stripe') return b.number && b.number >= 9;
    return true;
  });

  if (targets.length === 0) {
    return { angle: Math.random() * Math.PI * 2, power: 30 + Math.random() * 30 };
  }

  // EASY: 40% chance de alvo aleatório, 60% mais próximo
  if (difficulty === 'easy') {
    const target = Math.random() < 0.4
      ? targets[Math.floor(Math.random() * targets.length)]
      : getEasiestShot(targets, cueBall);
    const angle = Math.atan2(target.y - cueBall.y, target.x - cueBall.x);
    const error = (Math.random() - 0.5) * 0.3; // ±17°
    const power = 35 + Math.random() * 40;
    return { angle: angle + error, power };
  }

  // MEDIUM: alvo mais fácil (mais próximo com caminho livre)
  if (difficulty === 'medium') {
    const validTargets = targets.filter((t) => hasClearPath(cueBall, t, activeBalls));
    const target = validTargets.length > 0 ? getEasiestShot(validTargets, cueBall) : getEasiestShot(targets, cueBall);
    const angle = Math.atan2(target.y - cueBall.y, target.x - cueBall.x);
    const error = (Math.random() - 0.5) * 0.14; // ±8°
    const dist = getDistance(cueBall, target);
    const power = Math.min(85, Math.max(30, dist * 0.2 + 25));
    return { angle: angle + error, power };
  }

  // HARD: raycast + mira em caçapa
  const pocketShot = getBestPocketShot(targets, cueBall, activeBalls, pockets);
  if (pocketShot) {
    const error = (Math.random() - 0.5) * 0.035; // ±2°
    return { angle: pocketShot.angle + error, power: pocketShot.power };
  }

  // Fallback: melhor alvo com caminho livre
  const validTargets = targets.filter((t) => hasClearPath(cueBall, t, activeBalls));
  const target = validTargets.length > 0 ? getEasiestShot(validTargets, cueBall) : getEasiestShot(targets, cueBall);
  const angle = Math.atan2(target.y - cueBall.y, target.x - cueBall.x);
  const error = (Math.random() - 0.5) * 0.035;
  const dist = getDistance(cueBall, target);
  const power = Math.min(85, Math.max(30, dist * 0.2 + 25));
  return { angle: angle + error, power };
}
