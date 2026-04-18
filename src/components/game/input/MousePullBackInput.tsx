'use client';

import { useRef, useCallback, useState } from 'react';
import { Ball } from '@/types';

interface MousePullBackInputProps {
  balls: Ball[];
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
  onPlaceCueBall?: (x: number, y: number) => void;
  ballInHand?: boolean;
  disabled?: boolean;
}

export function MousePullBackInput({
  balls,
  onAimChange,
  onPowerChange,
  onShoot,
  onPlaceCueBall,
  ballInHand = false,
  disabled = false,
}: MousePullBackInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const pos = getLogicalPos(e.clientX, e.clientY);
      if (!pos) return;

      // Ball-in-hand: clique único posiciona a bola branca
      if (ballInHand && onPlaceCueBall) {
        onPlaceCueBall(pos.x, pos.y);
        return;
      }

      const cueBall = balls[0];
      if (!cueBall || cueBall.inPocket) return;
      const dist = Math.sqrt(
        Math.pow(pos.x - cueBall.x, 2) + Math.pow(pos.y - cueBall.y, 2)
      );
      if (dist <= cueBall.radius + 20) {
        setIsPulling(true);
      }
    },
    [balls, disabled, getLogicalPos, ballInHand, onPlaceCueBall]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPulling) return;
      const pos = getLogicalPos(e.clientX, e.clientY);
      if (!pos) return;
      const cueBall = balls[0];
      if (!cueBall) return;
      const dx = cueBall.x - pos.x;
      const dy = cueBall.y - pos.y;
      const angle = Math.atan2(dy, dx);
      const pullDistance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(Math.max(pullDistance * 0.4, 0), 100);
      onAimChange(angle);
      onPowerChange(power);
    },
    [isPulling, balls, getLogicalPos, onAimChange, onPowerChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isPulling) {
      setIsPulling(false);
      onShoot();
    }
  }, [isPulling, onShoot]);

  const cursorClass = ballInHand && !disabled ? 'cursor-pointer' : 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${cursorClass}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
