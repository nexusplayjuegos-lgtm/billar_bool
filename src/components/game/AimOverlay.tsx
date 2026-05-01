'use client';

import React from 'react';
import { Ball } from '@/types';
import { cn } from '@/lib/utils';

interface AimOverlayProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
  isBreakShot?: boolean;
  variant?: 'local' | 'opponent';
}

interface CollisionInfo {
  point: { x: number; y: number } | null;
  targetBall: Ball | null;
  targetDirection: { x: number; y: number } | null;
  cueSegments: Segment[];
}

interface Segment {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isBounce?: boolean;
}

const WALL_LEFT = 28;
const WALL_RIGHT = 772;
const WALL_TOP = 28;
const WALL_BOTTOM = 372;
const MAX_CUE_BOUNCES = 2;
const MAX_TARGET_BOUNCES = 1;
const POCKET_AIM_RADIUS = 20;
const POCKETS = [
  { x: 20, y: 20 },
  { x: 400, y: 20 },
  { x: 780, y: 20 },
  { x: 20, y: 380 },
  { x: 400, y: 380 },
  { x: 780, y: 380 },
];

function getCollisionDistance(
  from: { x: number; y: number; radius: number },
  targetBall: Ball,
  angle: number
): number | null {
  const dx = targetBall.x - from.x;
  const dy = targetBall.y - from.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const proj = dx * cos + dy * sin;
  if (proj <= 0) return null;

  const perp = Math.abs(dx * (-sin) + dy * cos);
  const hitDist = from.radius + targetBall.radius + 0.5;

  if (perp > hitDist) return null;

  const collisionDist = proj - Math.sqrt(hitDist * hitDist - perp * perp);
  return collisionDist;
}

function findFirstCollision(from: Ball, balls: Ball[], angle: number): CollisionInfo {
  let minDist: number | null = null;
  let targetBall: Ball | null = null;

  for (const ball of balls) {
    if (ball.id === from.id || ball.inPocket) continue;
    const dist = getCollisionDistance(from, ball, angle);
    if (dist !== null && (minDist === null || dist < minDist)) {
      minDist = dist;
      targetBall = ball;
    }
  }

  if (minDist === null) {
    return { point: null, targetBall: null, targetDirection: null, cueSegments: [] };
  }

  const point = {
    x: from.x + Math.cos(angle) * minDist,
    y: from.y + Math.sin(angle) * minDist,
  };

  // Calculate target ball direction after collision
  let targetDirection = null;
  if (targetBall) {
    const dx = point.x - targetBall.x;
    const dy = point.y - targetBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      targetDirection = { x: -dx / dist, y: -dy / dist };
    }
  }

  return {
    point,
    targetBall,
    targetDirection,
    cueSegments: [{ from, to: point }],
  };
}

function getRailHit(from: { x: number; y: number }, angle: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const candidates: { x: number; y: number; t: number; rail: 'vertical' | 'horizontal' }[] = [];

  if (dx > 0) candidates.push({ x: WALL_RIGHT, y: from.y + ((WALL_RIGHT - from.x) / dx) * dy, t: (WALL_RIGHT - from.x) / dx, rail: 'vertical' });
  if (dx < 0) candidates.push({ x: WALL_LEFT, y: from.y + ((WALL_LEFT - from.x) / dx) * dy, t: (WALL_LEFT - from.x) / dx, rail: 'vertical' });
  if (dy > 0) candidates.push({ x: from.x + ((WALL_BOTTOM - from.y) / dy) * dx, y: WALL_BOTTOM, t: (WALL_BOTTOM - from.y) / dy, rail: 'horizontal' });
  if (dy < 0) candidates.push({ x: from.x + ((WALL_TOP - from.y) / dy) * dx, y: WALL_TOP, t: (WALL_TOP - from.y) / dy, rail: 'horizontal' });

  return candidates
    .filter((p) => p.t > 0.01 && p.x >= WALL_LEFT - 0.01 && p.x <= WALL_RIGHT + 0.01 && p.y >= WALL_TOP - 0.01 && p.y <= WALL_BOTTOM + 0.01)
    .sort((a, b) => a.t - b.t)[0] ?? null;
}

function reflectAngle(angle: number, rail: 'vertical' | 'horizontal') {
  return rail === 'vertical' ? Math.PI - angle : -angle;
}

function getPocketHit(from: { x: number; y: number }, angle: number, beforeDistance?: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let bestPocket: { x: number; y: number; t: number } | null = null;

  for (const pocket of POCKETS) {
    const px = pocket.x - from.x;
    const py = pocket.y - from.y;
    const t = px * dx + py * dy;
    if (t <= 0) continue;
    if (beforeDistance !== undefined && t > beforeDistance + POCKET_AIM_RADIUS) continue;

    const perpendicular = Math.abs(px * (-dy) + py * dx);
    if (perpendicular > POCKET_AIM_RADIUS) continue;

    if (!bestPocket || t < bestPocket.t) {
      bestPocket = { ...pocket, t };
    }
  }

  return bestPocket;
}

function traceCueCollision(
  cueBall: Ball,
  balls: Ball[],
  angle: number
): CollisionInfo {
  let from = { x: cueBall.x, y: cueBall.y, radius: cueBall.radius };
  let currentAngle = angle;
  const cueSegments: Segment[] = [];

  for (let bounce = 0; bounce <= MAX_CUE_BOUNCES; bounce++) {
    const railHit = getRailHit(from, currentAngle);
    let nearestCollision: { ball: Ball; dist: number } | null = null;

    for (const ball of balls) {
      if (ball.id === cueBall.id || ball.inPocket) continue;
      const dist = getCollisionDistance(from, ball, currentAngle);
      if (dist !== null && (!nearestCollision || dist < nearestCollision.dist)) {
        nearestCollision = { ball, dist };
      }
    }

    if (nearestCollision && (!railHit || nearestCollision.dist < railHit.t)) {
      const point = {
        x: from.x + Math.cos(currentAngle) * nearestCollision.dist,
        y: from.y + Math.sin(currentAngle) * nearestCollision.dist,
      };
      const dx = nearestCollision.ball.x - point.x;
      const dy = nearestCollision.ball.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      cueSegments.push({ from, to: point, isBounce: bounce > 0 });

      return {
        point,
        targetBall: nearestCollision.ball,
        targetDirection: dist > 0 ? { x: dx / dist, y: dy / dist } : null,
        cueSegments,
      };
    }

    if (!railHit) break;
    cueSegments.push({ from, to: railHit, isBounce: bounce > 0 });
    currentAngle = reflectAngle(currentAngle, railHit.rail);
    from = {
      x: railHit.x + Math.cos(currentAngle) * 0.8,
      y: railHit.y + Math.sin(currentAngle) * 0.8,
      radius: cueBall.radius,
    };
  }

  if (cueSegments.length > 0) {
    return { point: null, targetBall: null, targetDirection: null, cueSegments };
  }

  return findFirstCollision(cueBall, balls, angle);
}

function traceRailSegments(from: { x: number; y: number }, angle: number, maxBounces: number): Segment[] {
  let currentFrom = from;
  let currentAngle = angle;
  const segments: Segment[] = [];

  for (let bounce = 0; bounce <= maxBounces; bounce++) {
    const railHit = getRailHit(currentFrom, currentAngle);
    const pocketHit = getPocketHit(currentFrom, currentAngle, railHit?.t);

    if (pocketHit) {
      segments.push({ from: currentFrom, to: pocketHit, isBounce: bounce > 0 });
      break;
    }

    if (!railHit) {
      segments.push({
        from: currentFrom,
        to: {
          x: currentFrom.x + Math.cos(currentAngle) * 260,
          y: currentFrom.y + Math.sin(currentAngle) * 260,
        },
        isBounce: bounce > 0,
      });
      break;
    }

    segments.push({ from: currentFrom, to: railHit, isBounce: bounce > 0 });
    currentAngle = reflectAngle(currentAngle, railHit.rail);
    currentFrom = {
      x: railHit.x + Math.cos(currentAngle) * 0.8,
      y: railHit.y + Math.sin(currentAngle) * 0.8,
    };
  }

  return segments;
}

export function AimOverlay({
  balls,
  aimAngle,
  power,
  isAiming,
  variant = 'local',
}: AimOverlayProps) {
  const cueBall = balls[0];
  if (!cueBall || cueBall.inPocket || !isAiming) return null;

  const collision = traceCueCollision(cueBall, balls, aimAngle);

  // Ghost ball position at collision point
  const ghostPos = collision.point;
  const ghostX = ghostPos ? ghostPos.x : null;
  const ghostY = ghostPos ? ghostPos.y : null;

  const targetSegments =
    collision.targetBall && collision.targetDirection
      ? traceRailSegments(
          { x: collision.targetBall.x, y: collision.targetBall.y },
          Math.atan2(collision.targetDirection.y, collision.targetDirection.x),
          MAX_TARGET_BOUNCES
        )
      : [];

  // Cue stick position: keep the tip just behind the cue ball at low power,
  // then pull it back visibly as the player charges the shot.
  const cueTipOffset = 4 + power * 0.78;
  const cueDistance = 82 + cueTipOffset;
  const cueX = cueBall.x - Math.cos(aimAngle) * cueDistance;
  const cueY = cueBall.y - Math.sin(aimAngle) * cueDistance;
  const cueRotation = (aimAngle * 180) / Math.PI;

  // Get cue colors based on equipped cue (placeholder - can be passed as prop later)
  const getCueColors = () => {
    return { shaft: '#d4a574', butt: '#8B4513', accent: '#8B4513' };
  };

  const cueColors = getCueColors();
  const isOpponent = variant === 'opponent';
  const whiteLine = isOpponent ? 'rgba(147, 197, 253, 0.75)' : 'url(#aimLineGrad)';
  const yellowLine = isOpponent ? 'rgba(96, 165, 250, 0.75)' : 'rgba(255, 196, 45, 0.9)';

  return (
    <svg
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200",
        isAiming ? "opacity-100" : "opacity-0"
      )}
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      style={{ zIndex: 10 }}
    >
      {/* DEFS - Gradients and filters */}
      <defs>
        {/* Aim line gradient */}
        <linearGradient id="aimLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="50%" stopColor="rgba(180,230,255,0.8)" />
          <stop offset="100%" stopColor="rgba(100,200,255,0.0)" />
        </linearGradient>

        {/* Cue gradient */}
        <linearGradient id="cueShaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={cueColors.shaft} stopOpacity="0.9" />
          <stop offset="50%" stopColor={cueColors.shaft} stopOpacity="1" />
          <stop offset="100%" stopColor={cueColors.shaft} stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="cueButtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cueColors.butt} />
          <stop offset="50%" stopColor={cueColors.accent} />
          <stop offset="100%" stopColor={cueColors.butt} />
        </linearGradient>
      </defs>

      {/* Ghost Ball at collision point */}
      {ghostX !== null && ghostY !== null && (
        <g>
          {/* Main ghost ball */}
          <circle
            cx={ghostX}
            cy={ghostY}
            r={cueBall.radius}
            fill="rgba(255, 255, 255, 0.25)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="2"
          />
          
          {/* Inner shine */}
          <circle
            cx={ghostX - cueBall.radius * 0.3}
            cy={ghostY - cueBall.radius * 0.3}
            r={cueBall.radius * 0.3}
            fill="rgba(255,255,255,0.4)"
          />

          {/* Target ball path: pure post-contact direction, no pocket snapping */}
          {targetSegments.map((segment, index) => (
            <line
              key={`target-${index}`}
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke={yellowLine}
              strokeWidth={segment.isBounce ? '2' : '2.7'}
              strokeDasharray={segment.isBounce ? '5,7' : '9,6'}
              strokeLinecap="round"
              opacity={segment.isBounce ? '0.68' : '0.95'}
            />
          ))}
        </g>
      )}

      {/* Cue ball path: where the cue is sending the white ball */}
      {collision.cueSegments.map((segment, index) => (
        <line
          key={`cue-${index}`}
          x1={segment.from.x}
          y1={segment.from.y}
          x2={segment.to.x}
          y2={segment.to.y}
          stroke={whiteLine}
          strokeWidth={segment.isBounce ? '2' : '2.5'}
          strokeDasharray={segment.isBounce ? '5,7' : '12,6'}
          strokeLinecap="round"
          opacity={segment.isBounce ? '0.68' : '1'}
        />
      ))}

      {/* Cue Stick */}
      <g
        transform={`translate(${cueX}, ${cueY}) rotate(${cueRotation}) scale(-1, 1)`}
      >
        {/* Cue shadow */}
        <rect
          x={-80}
          y={-3}
          width={160}
          height={6}
          rx={3}
          fill="rgba(0,0,0,0.3)"
          transform="translate(2, 2)"
        />
        
        {/* Cue tip */}
        <rect x={-82} y={-2.5} width={4} height={5} rx={1} fill="#2a2a2a" />
        <rect x={-80} y={-2} width={2} height={4} rx={0.5} fill="#4a4a4a" />
        
        {/* Cue shaft */}
        <rect
          x={-78}
          y={-2.5}
          width={100}
          height={5}
          fill="url(#cueShaftGrad)"
        />
        
        {/* Joint ring */}
        <rect x={22} y={-3} width={4} height={6} rx={1} fill="#FFD700" />
        <rect x={26} y={-2.5} width={2} height={5} rx={0.5} fill="#C0C0C0" />
        
        {/* Cue butt */}
        <rect
          x={28}
          y={-4}
          width={52}
          height={8}
          rx={2}
          fill="url(#cueButtGrad)"
        />
        
        {/* Decorative rings on butt */}
        <rect x={35} y={-4} width={2} height={8} fill="rgba(255,255,255,0.3)" />
        <rect x={50} y={-4} width={3} height={8} fill="#FFD700" opacity="0.8" />
        
        {/* Power indicator on cue */}
        {power > 0 && (
          <rect
            x={28}
            y={-4}
            width={(power / 100) * 52}
            height={8}
            rx={2}
            fill="rgba(255, 100, 100, 0.6)"
            style={{ mixBlendMode: 'overlay' }}
          />
        )}
      </g>

      {/* Power indicator near cue ball */}
      {power > 0 && (
        <g>
          <circle
            cx={cueBall.x}
            cy={cueBall.y}
            r={cueBall.radius + 8}
            fill="none"
            stroke="rgba(255, 100, 100, 0.6)"
            strokeWidth="2"
            strokeDasharray={`${(power / 100) * 50} 100`}
            transform={`rotate(-90 ${cueBall.x} ${cueBall.y})`}
          />
        </g>
      )}
    </svg>
  );
}
