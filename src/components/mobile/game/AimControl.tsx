'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AimControlProps {
  onAimChange: (angle: number) => void;
}

export function AimControl({ onAimChange }: AimControlProps) {
  const { gameState } = useGameStore();
  const [isDragging, setIsDragging] = useState(false);
  const [aimAngle, setAimAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !gameState) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cueBall = gameState.balls[0];

    const centerX = rect.left + (cueBall.x / 800) * rect.width;
    const centerY = rect.top + (cueBall.y / 400) * rect.height;

    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    setAimAngle(angle);
    onAimChange(angle);
    setIsDragging(true);
  }, [gameState, onAimChange]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current || !gameState) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cueBall = gameState.balls[0];

    const centerX = rect.left + (cueBall.x / 800) * rect.width;
    const centerY = rect.top + (cueBall.y / 400) * rect.height;

    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    setAimAngle(angle);
    onAimChange(angle);
  }, [isDragging, gameState, onAimChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!gameState) return null;

  const cueBall = gameState.balls[0];
  const lineLength = 150;
  const endX = cueBall.x + Math.cos(aimAngle) * lineLength;
  const endY = cueBall.y + Math.sin(aimAngle) * lineLength;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      {/* Linha de mira */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Linha pontilhada */}
        <line
          x1={cueBall.x}
          y1={cueBall.y}
          x2={endX}
          y2={endY}
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* Glow na ponta */}
        <circle
          cx={endX}
          cy={endY}
          r="6"
          fill="rgba(59, 130, 246, 0.5)"
          className="animate-pulse"
        />
      </svg>

      {/* Instrução */}
      {!isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm pointer-events-none"
        >
          Arraste para mirar
        </motion.div>
      )}
    </div>
  );
}
