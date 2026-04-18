'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Ball } from '@/types';

interface TouchDragInputProps {
  balls: Ball[];
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
  onPlaceCueBall?: (x: number, y: number) => void;
  ballInHand?: boolean;
  disabled?: boolean;
}

export function TouchDragInput({
  balls,
  onAimChange,
  onPowerChange,
  onShoot,
  onPlaceCueBall,
  ballInHand = false,
  disabled = false,
}: TouchDragInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const getLogicalPos = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = 800 / rect.width;
      const scaleY = 400 / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const pos = getLogicalPos(clientX, clientY);
      if (!pos) return;

      // Ball-in-hand: arrasta a bola branca
      if (ballInHand && onPlaceCueBall) {
        setIsPlacing(true);
        onPlaceCueBall(pos.x, pos.y);
        return;
      }

      const cueBall = balls[0];
      if (!cueBall || cueBall.inPocket) return;
      setIsDragging(true);
      const dx = cueBall.x - pos.x;
      const dy = cueBall.y - pos.y;
      const angle = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(Math.max(dist * 0.4, 0), 100);
      onAimChange(angle);
      onPowerChange(power);
    },
    [balls, disabled, getLogicalPos, onAimChange, onPowerChange, ballInHand, onPlaceCueBall]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isPlacing && ballInHand && onPlaceCueBall) {
        const pos = getLogicalPos(clientX, clientY);
        if (pos) onPlaceCueBall(pos.x, pos.y);
        return;
      }
      if (!isDragging) return;
      const pos = getLogicalPos(clientX, clientY);
      if (!pos) return;
      const cueBall = balls[0];
      if (!cueBall) return;
      const dx = cueBall.x - pos.x;
      const dy = cueBall.y - pos.y;
      const angle = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(Math.max(dist * 0.4, 0), 100);
      onAimChange(angle);
      onPowerChange(power);
    },
    [isDragging, isPlacing, balls, getLogicalPos, onAimChange, onPowerChange, ballInHand, onPlaceCueBall]
  );

  const handleEnd = useCallback(() => {
    if (isPlacing) {
      setIsPlacing(false);
      return;
    }
    if (!isDragging) return;
    setIsDragging(false);
    onShoot();
  }, [isDragging, isPlacing, onShoot]);

  const cursorClass = ballInHand && !disabled
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 touch-none ${cursorClass}`}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleEnd}
    />
  );
}
