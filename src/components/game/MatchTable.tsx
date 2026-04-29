'use client';

import { useRef, useLayoutEffect, useState, ReactNode } from 'react';
import { Ball } from '@/types';
import { PoolTable } from './PoolTable';
import { AimOverlay } from './AimOverlay';
import { PocketedBallRack } from './PocketedBallRack';

interface MatchTableProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
  isBreakShot?: boolean;
  pocketedBallIds?: number[];
  children: ReactNode;
  scale?: number;
}

export function MatchTable({
  balls,
  aimAngle,
  power,
  isAiming,
  isBreakShot,
  pocketedBallIds = [],
  children,
  scale = 1,
}: MatchTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      if (pw <= 0 || ph <= 0) return;
      const baseScale = Math.min(pw / 800, ph / 400) * scale;
      const width = Math.max(1, 800 * baseScale);
      const height = Math.max(1, 400 * baseScale);
      setSize({ width, height });
    };

    update();
    const ro = new ResizeObserver(update);
    if (el.parentElement) {
      ro.observe(el.parentElement);
    }
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: size.width, height: size.height }}>
        <PoolTable balls={balls} className="w-full h-full" />
        <PocketedBallRack balls={balls} pocketedBallIds={pocketedBallIds} />
        <AimOverlay balls={balls} aimAngle={aimAngle} power={power} isAiming={isAiming} isBreakShot={isBreakShot} />
        {children}
      </div>
    </div>
  );
}
