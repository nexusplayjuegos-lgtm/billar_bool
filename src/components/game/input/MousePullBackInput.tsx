'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Ball } from '@/types';

interface MousePullBackInputProps {
  balls: Ball[];
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
  onPlaceCueBall?: (x: number, y: number) => void;
  ballInHand?: boolean;
  disabled?: boolean;
  isBreakShot?: boolean;
}

const TABLE_LEFT = 28;
const TABLE_RIGHT = 772;
const TABLE_TOP = 28;
const TABLE_BOTTOM = 372;
const AIM_DEADZONE = 24;
const POWER_SCALE = 0.34;
const AIM_SMOOTHING = 0.12;

function getShotFromPull(cueBall: Ball, pos: { x: number; y: number }) {
  const dx = cueBall.x - pos.x;
  const dy = cueBall.y - pos.y;
  const pullDistance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const power = Math.min(Math.max((pullDistance - AIM_DEADZONE) * POWER_SCALE, 0), 100);
  return { angle, power };
}

function smoothAngle(previous: number, next: number) {
  let delta = next - previous;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return previous + delta * AIM_SMOOTHING;
}

export function MousePullBackInput({
  balls,
  onAimChange,
  onPowerChange,
  onShoot,
  onPlaceCueBall,
  ballInHand = false,
  disabled = false,
  isBreakShot = false,
}: MousePullBackInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const lastAngleRef = useRef(0);

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

  const updatePull = useCallback(
    (clientX: number, clientY: number) => {
      const pos = getLogicalPos(clientX, clientY);
      if (!pos) return;
      const cueBall = balls[0];
      if (!cueBall) return;
      const { angle, power } = getShotFromPull(cueBall, pos);
      if (power > 0) {
        const smoothedAngle = smoothAngle(lastAngleRef.current, angle);
        lastAngleRef.current = smoothedAngle;
        onAimChange(smoothedAngle);
      }
      onPowerChange(power);
    },
    [balls, getLogicalPos, onAimChange, onPowerChange]
  );

  const clampToTable = useCallback((x: number, y: number) => {
    const margin = 15;
    return {
      x: Math.max(TABLE_LEFT + margin, Math.min(TABLE_RIGHT - margin, x)),
      y: Math.max(TABLE_TOP + margin, Math.min(TABLE_BOTTOM - margin, y)),
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const pos = getLogicalPos(e.clientX, e.clientY);
      if (!pos) return;

      // Ball-in-hand: drag the white ball
      if (ballInHand && onPlaceCueBall) {
        const cueBall = balls[0];
        if (cueBall && !cueBall.inPocket) {
          const dist = Math.sqrt(
            Math.pow(pos.x - cueBall.x, 2) + Math.pow(pos.y - cueBall.y, 2)
          );
          if (dist <= cueBall.radius * 3) {
            setIsDraggingBall(true);
            setDragPos({ x: cueBall.x, y: cueBall.y });
            return;
          }
        }
        // Allow starting drag from anywhere
        setIsDraggingBall(true);
        const clamped = clampToTable(pos.x, pos.y);
        if (isBreakShot) {
          clamped.x = Math.min(clamped.x, 200 - 15);
        }
        setDragPos(clamped);
        return;
      }

      const cueBall = balls[0];
      if (!cueBall || cueBall.inPocket) return;
      const { angle, power } = getShotFromPull(cueBall, pos);
      setIsPulling(true);
      if (power > 0) {
        lastAngleRef.current = angle;
        onAimChange(angle);
      }
      onPowerChange(power);
    },
    [balls, disabled, getLogicalPos, clampToTable, ballInHand, onPlaceCueBall, isBreakShot, onAimChange, onPowerChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingBall) {
        const pos = getLogicalPos(e.clientX, e.clientY);
        if (!pos) return;
        const clamped = clampToTable(pos.x, pos.y);
        if (isBreakShot) {
          clamped.x = Math.min(clamped.x, 200 - 15);
        }
        setDragPos(clamped);
        return;
      }

      if (!isPulling) return;
      updatePull(e.clientX, e.clientY);
    },
    [isDraggingBall, isPulling, getLogicalPos, clampToTable, updatePull, isBreakShot]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingBall) {
      setIsDraggingBall(false);
      if (dragPos && onPlaceCueBall) {
        onPlaceCueBall(dragPos.x, dragPos.y);
      }
      setDragPos(null);
      return;
    }

    // A tacada de mouse é finalizada pelo listener global de document.
  }, [isDraggingBall, dragPos, onPlaceCueBall]);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingBall) {
      setIsDraggingBall(false);
      setDragPos(null);
    }
  }, [isDraggingBall]);

  useEffect(() => {
    if (!isPulling || isDraggingBall) return;

    const handleDocumentMove = (event: MouseEvent) => {
      updatePull(event.clientX, event.clientY);
    };

    const handleDocumentUp = () => {
      setIsPulling(false);
      onShoot();
    };

    document.addEventListener('mousemove', handleDocumentMove);
    document.addEventListener('mouseup', handleDocumentUp);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMove);
      document.removeEventListener('mouseup', handleDocumentUp);
    };
  }, [isPulling, isDraggingBall, updatePull, onShoot]);

  const cursorClass = ballInHand && !disabled
    ? isDraggingBall ? 'cursor-grabbing' : 'cursor-grab'
    : 'cursor-crosshair';

  return (
    <>
      {/* Visual drag indicator for ball-in-hand */}
      {isDraggingBall && dragPos && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${(dragPos.x / 800) * 100}%`,
            top: `${(dragPos.y / 400) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white border-2 border-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
        </div>
      )}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${cursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </>
  );
}
