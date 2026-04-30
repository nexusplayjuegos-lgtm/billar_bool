'use client';

import { useRef, useCallback, useState } from 'react';
import { Ball } from '@/types';

interface TouchDragInputProps {
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

function getShotFromPull(cueBall: Ball, pos: { x: number; y: number }) {
  const dx = cueBall.x - pos.x;
  const dy = cueBall.y - pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const power = Math.min(Math.max((dist - AIM_DEADZONE) * POWER_SCALE, 0), 100);
  return { angle, power };
}

export function TouchDragInput({
  balls,
  onAimChange,
  onPowerChange,
  onShoot,
  onPlaceCueBall,
  ballInHand = false,
  disabled = false,
  isBreakShot = false,
}: TouchDragInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

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

  const clampToTable = useCallback((x: number, y: number) => {
    const margin = 15;
    return {
      x: Math.max(TABLE_LEFT + margin, Math.min(TABLE_RIGHT - margin, x)),
      y: Math.max(TABLE_TOP + margin, Math.min(TABLE_BOTTOM - margin, y)),
    };
  }, []);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const pos = getLogicalPos(clientX, clientY);
      if (!pos) return;

      // Ball-in-hand: check if touching near the white ball
      if (ballInHand && onPlaceCueBall) {
        const cueBall = balls[0];
        if (cueBall && !cueBall.inPocket) {
          const dist = Math.sqrt(
            Math.pow(pos.x - cueBall.x, 2) + Math.pow(pos.y - cueBall.y, 2)
          );
          // Touch within 3x radius starts ball drag
          if (dist <= cueBall.radius * 3) {
            setIsDraggingBall(true);
            setDragPos({ x: cueBall.x, y: cueBall.y });
            return;
          }
        }
        // Also allow starting drag from anywhere when ball-in-hand (easier)
        setIsDraggingBall(true);
        const clamped = clampToTable(pos.x, pos.y);
        // Break shot: limit to left half
        if (isBreakShot) {
          clamped.x = Math.min(clamped.x, 200 - 15);
        }
        setDragPos(clamped);
        return;
      }

      const cueBall = balls[0];
      if (!cueBall || cueBall.inPocket) return;
      setIsDragging(true);
      const { angle, power } = getShotFromPull(cueBall, pos);
      onAimChange(angle);
      onPowerChange(power);
    },
    [balls, disabled, getLogicalPos, clampToTable, onAimChange, onPowerChange, ballInHand, onPlaceCueBall, isBreakShot]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isDraggingBall) {
        const pos = getLogicalPos(clientX, clientY);
        if (!pos) return;
        const clamped = clampToTable(pos.x, pos.y);
        // Break shot: limit to left half (head string)
        if (isBreakShot) {
          clamped.x = Math.min(clamped.x, 200 - 15);
        }
        setDragPos(clamped);
        return;
      }

      if (!isDragging) return;
      const pos = getLogicalPos(clientX, clientY);
      if (!pos) return;
      const cueBall = balls[0];
      if (!cueBall) return;
      const { angle, power } = getShotFromPull(cueBall, pos);
      onAimChange(angle);
      onPowerChange(power);
    },
    [isDraggingBall, isDragging, balls, getLogicalPos, clampToTable, onAimChange, onPowerChange, isBreakShot]
  );

  const handleEnd = useCallback(() => {
    if (isDraggingBall) {
      setIsDraggingBall(false);
      if (dragPos && onPlaceCueBall) {
        onPlaceCueBall(dragPos.x, dragPos.y);
      }
      setDragPos(null);
      return;
    }

    if (!isDragging) return;
    setIsDragging(false);
    onShoot();
  }, [isDraggingBall, isDragging, dragPos, onPlaceCueBall, onShoot]);

  const cursorClass = ballInHand && !disabled
    ? isDraggingBall ? 'cursor-grabbing' : 'cursor-grab'
    : 'cursor-default';

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
    </>
  );
}
