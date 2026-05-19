'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Ball } from '@/types';

interface TouchDragInputProps {
  balls: Ball[];
  onAimChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onPlaceCueBall?: (x: number, y: number) => void;
  ballInHand?: boolean;
  disabled?: boolean;
  isBreakShot?: boolean;
  aimAngle?: number;
}

const TABLE_LEFT = 28;
const TABLE_RIGHT = 772;
const TABLE_TOP = 28;
const TABLE_BOTTOM = 372;
const AIM_SMOOTHING = 0.16;
const AIM_MIN_TOUCH_DISTANCE = 42;
const AIM_DRAG_START_DISTANCE = 16;
const CUE_GRAB_WIDTH = 34;
const CUE_GRAB_BACK_DISTANCE = 260;

type AimGestureMode = 'direct' | 'cue';

function getShotFromPoint(cueBall: Ball, pos: { x: number; y: number }) {
  return Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
}

function getShotFromCue(cueBall: Ball, pos: { x: number; y: number }) {
  return Math.atan2(cueBall.y - pos.y, cueBall.x - pos.x);
}

function isStableAimPoint(cueBall: Ball, pos: { x: number; y: number }) {
  return Math.hypot(pos.x - cueBall.x, pos.y - cueBall.y) >= AIM_MIN_TOUCH_DISTANCE;
}

function getAimGestureMode(cueBall: Ball, pos: { x: number; y: number }, aimAngle: number): AimGestureMode {
  const dx = pos.x - cueBall.x;
  const dy = pos.y - cueBall.y;
  const forwardX = Math.cos(aimAngle);
  const forwardY = Math.sin(aimAngle);
  const projection = dx * forwardX + dy * forwardY;
  const perpendicular = Math.abs(dx * -forwardY + dy * forwardX);

  return projection < -cueBall.radius &&
    projection > -CUE_GRAB_BACK_DISTANCE &&
    perpendicular <= CUE_GRAB_WIDTH
    ? 'cue'
    : 'direct';
}

function getAimAngle(cueBall: Ball, pos: { x: number; y: number }, mode: AimGestureMode) {
  return mode === 'cue' ? getShotFromCue(cueBall, pos) : getShotFromPoint(cueBall, pos);
}

function smoothAngle(previous: number, next: number) {
  let delta = next - previous;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return previous + delta * AIM_SMOOTHING;
}

export function TouchDragInput({
  balls,
  onAimChange,
  onPowerChange,
  onPlaceCueBall,
  ballInHand = false,
  disabled = false,
  isBreakShot = false,
  aimAngle = 0,
}: TouchDragInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const lastAngleRef = useRef(0);
  const aimStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasStartedAimDragRef = useRef(false);
  const aimGestureModeRef = useRef<AimGestureMode>('direct');

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
      onPowerChange(0);
      lastAngleRef.current = aimAngle;
      aimStartPosRef.current = pos;
      hasStartedAimDragRef.current = false;
      aimGestureModeRef.current = getAimGestureMode(cueBall, pos, aimAngle);
    },
    [balls, disabled, getLogicalPos, clampToTable, onPowerChange, ballInHand, onPlaceCueBall, isBreakShot, aimAngle]
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
      if (!isStableAimPoint(cueBall, pos)) return;
      if (!hasStartedAimDragRef.current) {
        const startPos = aimStartPosRef.current;
        if (!startPos) return;
        const dragDistance = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
        if (dragDistance < AIM_DRAG_START_DISTANCE) return;
        hasStartedAimDragRef.current = true;
      }
      const angle = getAimAngle(cueBall, pos, aimGestureModeRef.current);
      const smoothedAngle = smoothAngle(lastAngleRef.current, angle);
      lastAngleRef.current = smoothedAngle;
      onAimChange(smoothedAngle);
    },
    [isDraggingBall, isDragging, balls, getLogicalPos, clampToTable, onAimChange, isBreakShot]
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
    aimStartPosRef.current = null;
    hasStartedAimDragRef.current = false;
    onPowerChange(0);
  }, [isDraggingBall, isDragging, dragPos, onPlaceCueBall, onPowerChange]);

  const handleLeave = useCallback(() => {
    if (isDraggingBall) {
      setIsDraggingBall(false);
      setDragPos(null);
    }
    if (isDragging) {
      setIsDragging(false);
      aimStartPosRef.current = null;
      hasStartedAimDragRef.current = false;
      onPowerChange(0);
    }
  }, [isDraggingBall, isDragging, onPowerChange]);

  useEffect(() => {
    if (!isDragging && !isDraggingBall) return;

    const handleDocumentMove = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    };

    const handleDocumentEnd = () => {
      handleEnd();
    };

    document.addEventListener('touchmove', handleDocumentMove, { passive: false });
    document.addEventListener('touchend', handleDocumentEnd);
    document.addEventListener('touchcancel', handleDocumentEnd);

    return () => {
      document.removeEventListener('touchmove', handleDocumentMove);
      document.removeEventListener('touchend', handleDocumentEnd);
      document.removeEventListener('touchcancel', handleDocumentEnd);
    };
  }, [isDragging, isDraggingBall, handleMove, handleEnd]);

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
        onMouseLeave={handleLeave}
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
