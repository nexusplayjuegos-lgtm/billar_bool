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

  const getColor = (v: number) => {
    if (v < 33) return 'from-green-400 to-green-500';
    if (v < 66) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', disabled && 'opacity-45')}>
      <span className="text-white/60 text-xs font-medium">FORÇA</span>

      <div
        ref={trackRef}
        role="slider"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className={cn(
          'relative h-40 w-12 touch-none overflow-hidden rounded-full border border-slate-700 bg-slate-800',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        {/* Barra de fundo */}
        <div className="absolute inset-x-2 top-2 bottom-2 bg-slate-900 rounded-full" />

        {/* Barra de poder */}
        <motion.div
          className={cn(
            'absolute inset-x-2 bottom-2 rounded-full bg-gradient-to-t',
            getColor(value)
          )}
          style={{ height: `${value}%` }}
          animate={{ height: `${value}%` }}
          transition={{ type: 'spring', stiffness: 300 }}
        />

        {/* Marcadores */}
        <div className="absolute inset-x-0 top-1/4 h-px bg-slate-700/50" />
        <div className="absolute inset-x-0 top-2/4 h-px bg-slate-700/50" />
        <div className="absolute inset-x-0 top-3/4 h-px bg-slate-700/50" />
      </div>

      {/* Valor */}
      <motion.span
        animate={{ scale: isDragging ? 1.2 : 1 }}
        className={cn(
          'text-lg font-bold',
          value < 33 && 'text-green-400',
          value >= 33 && value < 66 && 'text-yellow-400',
          value >= 66 && 'text-red-400'
        )}
      >
        {value}%
      </motion.span>
    </div>
  );
}
