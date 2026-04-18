'use client';

import { Ball } from '@/types';
import { cn } from '@/lib/utils';

interface AimOverlayProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
}

export function AimOverlay({ balls, aimAngle, power, isAiming }: AimOverlayProps) {
  const cueBall = balls[0];
  if (!cueBall || cueBall.inPocket || !isAiming) return null;

  const lineLength = 200;
  const endX = cueBall.x + Math.cos(aimAngle) * lineLength;
  const endY = cueBall.y + Math.sin(aimAngle) * lineLength;

  // Taco mais curto e proporcional
  const cueLength = 90;
  const cuePullback = Math.min(power * 1.0, 70);
  const cueStartX = cueBall.x - Math.cos(aimAngle) * (cueBall.radius + 8 + cuePullback);
  const cueStartY = cueBall.y - Math.sin(aimAngle) * (cueBall.radius + 8 + cuePullback);
  const cueEndX = cueStartX - Math.cos(aimAngle) * cueLength;
  const cueEndY = cueStartY - Math.sin(aimAngle) * cueLength;

  // Posições do anel e ponta do taco
  const ringStartX = cueStartX - Math.cos(aimAngle) * 2;
  const ringStartY = cueStartY - Math.sin(aimAngle) * 2;
  const ringEndX = cueStartX - Math.cos(aimAngle) * 10;
  const ringEndY = cueStartY - Math.sin(aimAngle) * 10;
  const tipEndX = ringEndX - Math.cos(aimAngle) * 6;
  const tipEndY = ringEndY - Math.sin(aimAngle) * 6;

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

      {/* Linha de mira sólida (estilo 8 Ball Pool) */}
      <line
        x1={cueBall.x}
        y1={cueBall.y}
        x2={endX}
        y2={endY}
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="1.5"
      />
      {/* Círculo de precisão na ponta */}
      <circle cx={endX} cy={endY} r="6" fill="rgba(59, 130, 246, 0.5)" className="animate-pulse" />
      <circle
        cx={endX}
        cy={endY}
        r="12"
        fill="none"
        stroke="rgba(59, 130, 246, 0.25)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

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
