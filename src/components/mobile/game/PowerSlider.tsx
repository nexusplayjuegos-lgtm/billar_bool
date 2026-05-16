'use client';

import { type PointerEvent, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PowerSliderProps {
  value: number;
  onChange: (value: number) => void;
  onShoot: (value: number) => void;
  disabled?: boolean;
  minShootPower?: number;
}

export function PowerSlider({ value, onChange, onShoot, disabled = false, minShootPower = 8 }: PowerSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const liveValueRef = useRef(value);
  const isDraggingRef = useRef(false);

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const nextValue = Math.round(Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) * 100);
      liveValueRef.current = nextValue;
      onChange(nextValue);
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
      updateFromPointer(event.clientY);
    },
    [disabled, updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;
      updateFromPointer(event.clientY);
    },
    [disabled, isDragging, updateFromPointer]
  );

  const finishDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const shotPower = liveValueRef.current;
    if (shotPower >= minShootPower) {
      onShoot(shotPower);
      return;
    }
    onChange(0);
  }, [minShootPower, onChange, onShoot]);

  const getPowerColor = (v: number): string => {
    if (v < 30) return '#22c55e';
    if (v < 70) return '#eab308';
    return '#ef4444';
  };

  const powerColor = getPowerColor(value);

  return (
    <div className={cn('flex flex-col items-center gap-2', disabled && 'opacity-45')}>
      <motion.span
        animate={{ scale: isDragging ? 1.12 : 1 }}
        className="rounded-full border border-slate-700/70 bg-slate-950/85 px-2 py-0.5 text-xs font-black"
        style={{ color: powerColor }}
      >
        {value}%
      </motion.span>

      <div
        ref={trackRef}
        role="slider"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className={cn(
          'relative h-[150px] w-[30px] touch-none overflow-hidden rounded-lg border border-slate-600/80 bg-[#1a1a2e] shadow-xl shadow-black/30',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="absolute inset-1 rounded-md bg-slate-950/70" />

        <motion.div
          className="absolute inset-x-1 bottom-1 rounded-md"
          style={{ height: `${value}%` }}
          animate={{
            height: `${value}%`,
            background: `linear-gradient(to top, ${powerColor}, rgba(255,255,255,0.88))`,
            boxShadow: `0 0 16px ${powerColor}66`,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        />

        <div className="absolute inset-x-0 top-[30%] h-px bg-white/15" />
        <div className="absolute inset-x-0 top-[70%] h-px bg-white/15" />
        <div className="absolute inset-x-0 bottom-1 top-1 rounded-lg ring-1 ring-inset ring-white/10" />
      </div>
    </div>
  );
}
