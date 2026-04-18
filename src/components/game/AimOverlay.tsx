'use client';

import { motion } from 'framer-motion';
import { Ball } from '@/types';

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

  const cueLength = 120;
  const cuePullback = Math.min(power * 1.2, 80);
  const cueStartX = cueBall.x - Math.cos(aimAngle) * (cueBall.radius + 10 + cuePullback);
  const cueStartY = cueBall.y - Math.sin(aimAngle) * (cueBall.radius + 10 + cuePullback);
  const cueEndX = cueStartX - Math.cos(aimAngle) * cueLength;
  const cueEndY = cueStartY - Math.sin(aimAngle) * cueLength;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
    >
      <line
        x1={cueBall.x}
        y1={cueBall.y}
        x2={endX}
        y2={endY}
        stroke="rgba(255, 255, 255, 0.7)"
        strokeWidth="2"
        strokeDasharray="10,5"
      />
      <circle cx={endX} cy={endY} r="8" fill="rgba(59, 130, 246, 0.6)" className="animate-pulse" />
      <circle
        cx={endX}
        cy={endY}
        r="15"
        fill="none"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <g>
        <line
          x1={cueStartX}
          y1={cueStartY}
          x2={cueEndX}
          y2={cueEndY}
          stroke="#d4a574"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1={cueStartX}
          y1={cueStartY}
          x2={cueStartX - Math.cos(aimAngle) * 30}
          y2={cueStartY - Math.sin(aimAngle) * 30}
          stroke="#1a1a1a"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
