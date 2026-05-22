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
          ? (rect.right - clientX) / rect.width
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
  const cuePosition = isHorizontal ? `${100 - value}%` : `${10 + value * 0.78}%`;
  const cueAssetOffset = `${value * 0.12}%`;
  const meterFillStyle = isHorizontal
    ? {
        width: `${value}%`,
        right: '4px',
        background: `linear-gradient(to left, ${powerColor}, rgba(255,255,255,0.88))`,
        boxShadow: `0 0 16px ${powerColor}66`,
      }
    : {
        height: `${value}%`,
        top: '4px',
        background: `linear-gradient(to bottom, ${powerColor}, rgba(255,255,255,0.88))`,
        boxShadow: `0 0 16px ${powerColor}66`,
      };

  return (
    <div className={cn(isHorizontal ? 'flex w-full items-center gap-2' : 'flex flex-col items-center gap-2', disabled && 'opacity-45')}>
      <motion.span
        animate={{ scale: isDragging ? 1.12 : 1 }}
        className={cn(
          'rounded border border-blue-200/30 bg-[#1b2b54] text-center font-black leading-none shadow-inner shadow-black/40',
          isHorizontal ? 'min-w-11 px-1.5 py-1 text-[10px]' : 'min-w-12 px-2 py-0.5 text-xs'
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
          'relative touch-none overflow-hidden border border-[#61709b] bg-[#111b35] shadow-xl shadow-black/40',
          isHorizontal ? 'mobile-power-track-horizontal min-w-0 flex-1 rounded shadow-md' : 'mobile-power-track-vertical w-[48px] rounded-lg',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent_18%,transparent_82%,rgba(255,255,255,0.08))]" />
        <div className={cn('absolute bg-[#081126] shadow-inner shadow-black/60', isHorizontal ? 'inset-x-1 inset-y-1 rounded-sm' : 'inset-1 rounded-sm')} />
        <motion.div
          className={cn('absolute rounded-sm', isHorizontal ? 'inset-y-1' : 'inset-x-1')}
          style={meterFillStyle}
          animate={meterFillStyle}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        />
        <div className={cn('absolute opacity-80', isHorizontal ? 'inset-y-1 right-1 w-1 bg-red-500' : 'inset-x-1 bottom-1 h-1 bg-red-500')} />
        <div className={cn('absolute opacity-80', isHorizontal ? 'inset-y-1 right-[33%] w-px bg-yellow-300/70' : 'inset-x-1 top-[66%] h-px bg-yellow-300/70')} />
        <div className={cn('absolute opacity-80', isHorizontal ? 'inset-y-1 right-[66%] w-px bg-green-300/70' : 'inset-x-1 top-[33%] h-px bg-green-300/70')} />

        {isHorizontal ? (
          <motion.div
            className="absolute top-1/2 h-4 w-20 rounded-full"
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
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]"
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
            className="absolute inset-x-1 rounded-sm"
            style={{ height: `${value}%` }}
            animate={{
              height: `${value}%`,
              top: '4px',
              background: `linear-gradient(to bottom, ${powerColor}, rgba(255,255,255,0.88))`,
              boxShadow: `0 0 16px ${powerColor}66`,
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          />
        )}

        {!isHorizontal && (
          <>
            <motion.div
              className="absolute left-1/2 top-[10%] z-10 h-[80%] w-7 -translate-x-1/2 rounded-full border border-white/20 bg-black/25 shadow-inner shadow-black/70"
              animate={{ boxShadow: isDragging ? `inset 0 0 12px ${powerColor}55, 0 0 16px ${powerColor}33` : 'inset 0 0 12px rgba(0,0,0,0.7)' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute left-[49%] top-[9%] z-20 h-[72%] w-5 -translate-x-1/2 bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_7px_rgba(0,0,0,0.65)]"
              style={{
                backgroundImage: 'url(/power-cue.svg)',
              }}
              animate={{
                y: cueAssetOffset,
                filter: isDragging ? 'brightness(1.18)' : 'brightness(1)',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            />
            <motion.div
              className="absolute left-1/2 z-30 h-3 w-9 -translate-x-1/2 rounded border border-white/40 bg-white/85 shadow-md shadow-black/40"
              style={{ top: cuePosition }}
              animate={{ top: cuePosition, scale: isDragging ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            />
          </>
        )}

        <div className={cn('absolute ring-1 ring-inset ring-white/15', isHorizontal ? 'inset-x-1 inset-y-1 rounded-sm' : 'inset-x-0 bottom-1 top-1 rounded-sm')} />
      </div>
    </div>
  );
}
