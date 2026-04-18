'use client';

import { Ball } from '@/types';
import { cn } from '@/lib/utils';

interface AimOverlayProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
}

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

function findFirstCollision(cueBall: Ball, balls: Ball[], angle: number) {
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

  return { distance: minDist, targetBall };
}

export function AimOverlay({ balls, aimAngle, power, isAiming }: AimOverlayProps) {
  const cueBall = balls[0];
  if (!cueBall || cueBall.inPocket || !isAiming) return null;

  const MAX_LINE = 250;
  const collision = findFirstCollision(cueBall, balls, aimAngle);

  const lineLength = collision.distance !== null ? Math.min(MAX_LINE, collision.distance) : MAX_LINE;
  const endX = cueBall.x + Math.cos(aimAngle) * lineLength;
  const endY = cueBall.y + Math.sin(aimAngle) * lineLength;

  // Ghost ball position (where cue ball would be at collision)
  const ghostX = collision.distance !== null
    ? cueBall.x + Math.cos(aimAngle) * collision.distance
    : null;
  const ghostY = collision.distance !== null
    ? cueBall.y + Math.sin(aimAngle) * collision.distance
    : null;

  // Bounce preview (simple wall reflection)
  const wallBounce = () => {
    let bx = endX;
    let by = endY;
    let bAngle = aimAngle;
    let remaining = MAX_LINE - lineLength;

    if (remaining <= 0) return null;

    // Simple wall check for preview
    if (bx < 30 || bx > 770) {
      bAngle = Math.PI - bAngle;
      bx = bx < 30 ? 30 : 770;
    }
    if (by < 30 || by > 370) {
      bAngle = -bAngle;
      by = by < 30 ? 30 : 370;
    }

    const bounceEndX = bx + Math.cos(bAngle) * remaining * 0.6;
    const bounceEndY = by + Math.sin(bAngle) * remaining * 0.6;
    return { x1: bx, y1: by, x2: bounceEndX, y2: bounceEndY };
  };

  const bounce = wallBounce();

  // Taco mais curto e proporcional
  const cueLength = 85;
  const cuePullback = Math.min(power * 1.0, 65);
  const cueStartX = cueBall.x - Math.cos(aimAngle) * (cueBall.radius + 6 + cuePullback);
  const cueStartY = cueBall.y - Math.sin(aimAngle) * (cueBall.radius + 6 + cuePullback);
  const cueEndX = cueStartX - Math.cos(aimAngle) * cueLength;
  const cueEndY = cueStartY - Math.sin(aimAngle) * cueLength;

  // Posições do anel e ponta do taco
  const ringStartX = cueStartX - Math.cos(aimAngle) * 2;
  const ringStartY = cueStartY - Math.sin(aimAngle) * 2;
  const ringEndX = cueStartX - Math.cos(aimAngle) * 10;
  const ringEndY = cueStartY - Math.sin(aimAngle) * 10;
  const tipEndX = ringEndX - Math.cos(aimAngle) * 5;
  const tipEndY = ringEndY - Math.sin(aimAngle) * 5;

  const powerColor =
    power < 33
      ? 'text-green-400 border-green-500/50 bg-green-500/20'
      : power < 66
        ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/20'
        : 'text-red-400 border-red-500/50 bg-red-500/20';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="cueBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6b4c1e" />
          <stop offset="25%" stopColor="#c9a84c" />
          <stop offset="50%" stopColor="#e8c868" />
          <stop offset="75%" stopColor="#b8933a" />
          <stop offset="100%" stopColor="#7a5a22" />
        </linearGradient>
      </defs>

      {/* Linha de mira principal */}
      <line
        x1={cueBall.x}
        y1={cueBall.y}
        x2={endX}
        y2={endY}
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth="1.5"
      />

      {/* Linha de ricochete (após colisão com parede) */}
      {bounce && (
        <line
          x1={bounce.x1}
          y1={bounce.y1}
          x2={bounce.x2}
          y2={bounce.y2}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1"
          strokeDasharray="6,4"
        />
      )}

      {/* Círculo de precisão na ponta */}
      <circle cx={endX} cy={endY} r="5" fill="rgba(59, 130, 246, 0.5)" className="animate-pulse" />
      <circle
        cx={endX}
        cy={endY}
        r="10"
        fill="none"
        stroke="rgba(59, 130, 246, 0.2)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* Ghost ball na posição de colisão */}
      {ghostX !== null && ghostY !== null && (
        <>
          <circle
            cx={ghostX}
            cy={ghostY}
            r={cueBall.radius}
            fill="rgba(255, 255, 255, 0.15)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
            strokeDasharray="3,2"
          />
          {/* Seta indicando direção após colisão */}
          {collision.targetBall && (
            <line
              x1={ghostX}
              y1={ghostY}
              x2={ghostX + Math.cos(aimAngle) * 40}
              y2={ghostY + Math.sin(aimAngle) * 40}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="4,3"
            />
          )}
        </>
      )}

      {/* Taco profissional */}
      <g>
        {/* Corpo do taco - madeira com gradiente */}
        <line
          x1={cueEndX}
          y1={cueEndY}
          x2={ringEndX}
          y2={ringEndY}
          stroke="url(#cueBody)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Anel preto na ponta */}
        <line
          x1={ringEndX}
          y1={ringEndY}
          x2={ringStartX}
          y2={ringStartY}
          stroke="#111111"
          strokeWidth="5.5"
          strokeLinecap="butt"
        />
        {/* Ponta branca (giz) */}
        <line
          x1={ringStartX}
          y1={ringStartY}
          x2={tipEndX}
          y2={tipEndY}
          stroke="#f0f0f0"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Indicador de potência discreto */}
      <g>
        <rect
          x={cueBall.x - 22}
          y={cueBall.y - 28}
          width="44"
          height="18"
          rx="9"
          className={cn('stroke-current', powerColor)}
          fill="rgba(15, 23, 42, 0.85)"
          strokeWidth="1"
        />
        <text
          x={cueBall.x}
          y={cueBall.y - 16}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="currentColor"
          className={cn('', powerColor)}
        >
          {Math.round(power)}%
        </text>
      </g>
    </svg>
  );
}
