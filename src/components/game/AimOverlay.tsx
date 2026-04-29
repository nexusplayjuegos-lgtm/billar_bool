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
}

interface CollisionInfo {
  point: { x: number; y: number } | null;
  targetBall: Ball | null;
  targetDirection: { x: number; y: number } | null;
}

const WALL_LEFT = 28;
const WALL_RIGHT = 772;
const WALL_TOP = 28;
const WALL_BOTTOM = 372;
const FRICTION = 0.985;
const SHOT_SPEED = 0.3;
const MAX_PREDICTION_STEPS = 180;

function getCollisionDistance(
  cueBall: Ball,
  targetBall: Ball,
  angle: number
): number | null {
  const dx = targetBall.x - cueBall.x;
  const dy = targetBall.y - cueBall.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const proj = dx * cos + dy * sin;
  if (proj <= 0) return null;

  const perp = Math.abs(dx * (-sin) + dy * cos);
  const hitDist = cueBall.radius + targetBall.radius + 0.5;

  if (perp > hitDist) return null;

  const collisionDist = proj - Math.sqrt(hitDist * hitDist - perp * perp);
  return collisionDist;
}

function findFirstCollision(cueBall: Ball, balls: Ball[], angle: number): CollisionInfo {
  let minDist: number | null = null;
  let targetBall: Ball | null = null;

  for (const ball of balls) {
    if (ball.id === cueBall.id || ball.inPocket) continue;
    const dist = getCollisionDistance(cueBall, ball, angle);
    if (dist !== null && (minDist === null || dist < minDist)) {
      minDist = dist;
      targetBall = ball;
    }
  }

  if (minDist === null) {
    return { point: null, targetBall: null, targetDirection: null };
  }

  const point = {
    x: cueBall.x + Math.cos(angle) * minDist,
    y: cueBall.y + Math.sin(angle) * minDist,
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

  return { point, targetBall, targetDirection };
}

function predictEngineCollision(
  cueBall: Ball,
  balls: Ball[],
  angle: number,
  power: number
): CollisionInfo {
  let x = cueBall.x;
  let y = cueBall.y;
  let vx = Math.cos(angle) * power * SHOT_SPEED;
  let vy = Math.sin(angle) * power * SHOT_SPEED;

  for (let step = 0; step < MAX_PREDICTION_STEPS; step++) {
    x += vx;
    y += vy;

    if (x < WALL_LEFT) {
      x = WALL_LEFT;
      vx = -vx;
    } else if (x > WALL_RIGHT) {
      x = WALL_RIGHT;
      vx = -vx;
    }

    if (y < WALL_TOP) {
      y = WALL_TOP;
      vy = -vy;
    } else if (y > WALL_BOTTOM) {
      y = WALL_BOTTOM;
      vy = -vy;
    }

    for (const ball of balls) {
      if (ball.id === cueBall.id || ball.inPocket) continue;

      const dx = ball.x - x;
      const dy = ball.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = cueBall.radius + ball.radius;

      if (dist < minDist && dist > 0) {
        return {
          point: { x, y },
          targetBall: ball,
          targetDirection: { x: dx / dist, y: dy / dist },
        };
      }
    }

    vx *= FRICTION;
    vy *= FRICTION;

    if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) break;
  }

  return findFirstCollision(cueBall, balls, angle);
}

function getRailPoint(from: { x: number; y: number }, angle: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const candidates: { x: number; y: number; t: number }[] = [];

  if (dx > 0) candidates.push({ x: WALL_RIGHT, y: from.y + ((WALL_RIGHT - from.x) / dx) * dy, t: (WALL_RIGHT - from.x) / dx });
  if (dx < 0) candidates.push({ x: WALL_LEFT, y: from.y + ((WALL_LEFT - from.x) / dx) * dy, t: (WALL_LEFT - from.x) / dx });
  if (dy > 0) candidates.push({ x: from.x + ((WALL_BOTTOM - from.y) / dy) * dx, y: WALL_BOTTOM, t: (WALL_BOTTOM - from.y) / dy });
  if (dy < 0) candidates.push({ x: from.x + ((WALL_TOP - from.y) / dy) * dx, y: WALL_TOP, t: (WALL_TOP - from.y) / dy });

  return candidates
    .filter((p) => p.t > 0 && p.x >= WALL_LEFT && p.x <= WALL_RIGHT && p.y >= WALL_TOP && p.y <= WALL_BOTTOM)
    .sort((a, b) => a.t - b.t)[0] ?? {
      x: from.x + dx * 300,
      y: from.y + dy * 300,
    };
}

export function AimOverlay({
  balls,
  aimAngle,
  power,
  isAiming,
}: AimOverlayProps) {
  const cueBall = balls[0];
  if (!cueBall || cueBall.inPocket || !isAiming) return null;

  const collision = predictEngineCollision(cueBall, balls, aimAngle, power);

  // Ghost ball position at collision point
  const ghostPos = collision.point;
  const ghostX = ghostPos ? ghostPos.x : null;
  const ghostY = ghostPos ? ghostPos.y : null;

  const cuePathEnd = ghostPos ?? getRailPoint(cueBall, aimAngle);
  const targetPathEnd =
    collision.targetBall && collision.targetDirection
      ? getRailPoint(
          collision.targetBall,
          Math.atan2(collision.targetDirection.y, collision.targetDirection.x)
        )
      : null;

  // Cue stick position (behind cue ball)
  const cueDistance = 60 + (power * 0.3); // Cue pulls back when charging
  const cueX = cueBall.x - Math.cos(aimAngle) * cueDistance;
  const cueY = cueBall.y - Math.sin(aimAngle) * cueDistance;
  const cueRotation = (aimAngle * 180) / Math.PI;

  // Get cue colors based on equipped cue (placeholder - can be passed as prop later)
  const getCueColors = () => {
    return { shaft: '#d4a574', butt: '#8B4513', accent: '#8B4513' };
  };

  const cueColors = getCueColors();

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
          {collision.targetBall && collision.targetDirection && targetPathEnd && (
            <line
              x1={collision.targetBall.x + collision.targetDirection.x * collision.targetBall.radius}
              y1={collision.targetBall.y + collision.targetDirection.y * collision.targetBall.radius}
              x2={targetPathEnd.x}
              y2={targetPathEnd.y}
              stroke="rgba(255, 196, 45, 0.9)"
              strokeWidth="2.5"
              strokeDasharray="9,6"
              strokeLinecap="round"
            />
          )}
        </g>
      )}

      {/* Cue ball path: where the cue is sending the white ball */}
      <line
        x1={cueBall.x}
        y1={cueBall.y}
        x2={cuePathEnd.x}
        y2={cuePathEnd.y}
        stroke="url(#aimLineGrad)"
        strokeWidth="2.5"
        strokeDasharray="12,6"
        strokeLinecap="round"
      />

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
