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
  orientation?: 'vertical' | 'horizontal';
}

export function PowerSlider({
  value,
  onChange,
  onShoot,
  disabled = false,
  minShootPower = 8,
  orientation = 'vertical',
}: PowerSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const liveValueRef = useRef(value);
  const isDraggingRef = useRef(false);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const rawValue =
        orientation === 'horizontal'
          ? (clientX - rect.left) / rect.width
          : (clientY - rect.top) / rect.height;
      const nextValue = Math.round(Math.max(0, Math.min(1, rawValue)) * 100);
      liveValueRef.current = nextValue;
      onChange(nextValue);
    },
    [onChange, orientation]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
      updateFromPointer(event.clientX, event.clientY);
    },
    [disabled, updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;
      updateFromPointer(event.clientX, event.clientY);
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
  const isHorizontal = orientation === 'horizontal';
  const cuePosition = `${value}%`;

  return (
    <div className={cn(isHorizontal ? 'flex w-full items-center gap-1.5' : 'flex flex-col items-center gap-2', disabled && 'opacity-45')}>
      <motion.span
        animate={{ scale: isDragging ? 1.12 : 1 }}
        className={cn(
          'rounded-full border border-slate-700/70 bg-slate-950/85 text-center font-black leading-none',
          isHorizontal ? 'min-w-9 px-1 py-0.5 text-[9px]' : 'min-w-12 px-2 py-0.5 text-xs'
        )}
        style={{ color: powerColor }}
      >
        {value}%
      </motion.span>

      <div
        ref={trackRef}
        role="slider"
        aria-orientation={orientation}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className={cn(
          'relative touch-none overflow-hidden border border-slate-600/80 bg-[#101827] shadow-xl shadow-black/30',
          isHorizontal ? 'mobile-power-track-horizontal min-w-0 flex-1 rounded-full shadow-md' : 'mobile-power-track-vertical w-[30px] rounded-lg',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className={cn('absolute bg-slate-950/80', isHorizontal ? 'inset-x-1 inset-y-[5px] rounded-full' : 'inset-1 rounded-md')} />

        {isHorizontal ? (
          <motion.div
            className="absolute top-1/2 h-3.5 w-16 rounded-full"
            style={{ left: cuePosition }}
            animate={{
              left: cuePosition,
              filter: isDragging ? 'brightness(1.18)' : 'brightness(1)',
              scale: isDragging ? 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div
              className="absolute inset-0 -translate-y-1/2"
              style={{ transform: `translate(-${value}%, -50%)` }}
            >
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                viewBox="0 0 80 14"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="power-cue-grip" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#3b2415" />
                    <stop offset="48%" stopColor="#7c3f18" />
                    <stop offset="100%" stopColor="#b7791f" />
                  </linearGradient>
                  <linearGradient id="power-cue-shaft" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#b7791f" />
                    <stop offset="60%" stopColor="#f5d58a" />
                    <stop offset="100%" stopColor="#fff7d6" />
                  </linearGradient>
                </defs>
                <rect x="0.5" y="4" width="18" height="6" rx="1.5" fill="url(#power-cue-grip)" stroke="#2a160b" strokeWidth="0.8" />
                <rect x="4" y="4.5" width="1.2" height="5" fill="#d6a84f" opacity="0.9" />
                <rect x="8.5" y="4.5" width="1.2" height="5" fill="#d6a84f" opacity="0.9" />
                <rect x="13" y="4.5" width="1.2" height="5" fill="#d6a84f" opacity="0.9" />
                <polygon points="18,4.6 72,5.9 72,8.1 18,9.4" fill="url(#power-cue-shaft)" stroke="#8a4b18" strokeWidth="0.45" />
                <rect x="72" y="5.3" width="4.8" height="3.4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.45" />
                <rect x="76.6" y="5.8" width="2.8" height="2.4" fill="#38bdf8" stroke="#0f4f6b" strokeWidth="0.45" />
              </svg>
            </div>
          </motion.div>
        ) : (
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
        )}

        <div className={cn('absolute bg-white/15', isHorizontal ? 'inset-y-0 left-[30%] w-px' : 'inset-x-0 top-[30%] h-px')} />
        <div className={cn('absolute bg-white/15', isHorizontal ? 'inset-y-0 left-[70%] w-px' : 'inset-x-0 top-[70%] h-px')} />
        <div className={cn('absolute ring-1 ring-inset ring-white/10', isHorizontal ? 'inset-x-1 inset-y-[5px] rounded-full' : 'inset-x-0 bottom-1 top-1 rounded-lg')} />
      </div>
    </div>
  );
}
