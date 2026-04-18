'use client';

import { useRef, useLayoutEffect, useState, ReactNode } from 'react';
import { Ball } from '@/types';
import { PoolTable } from './PoolTable';
import { AimOverlay } from './AimOverlay';

interface MatchTableProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
  children: ReactNode;
}

export function MatchTable({ balls, aimAngle, power, isAiming, children }: MatchTableProps) {
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
      const scale = Math.min(pw / 800, ph / 400);
      const width = Math.max(1, 800 * scale);
      const height = Math.max(1, 400 * scale);
      setSize({ width, height });
    };

    update();
    const ro = new ResizeObserver(update);
    if (el.parentElement) {
      ro.observe(el.parentElement);
    }
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: size.width, height: size.height }}>
        <PoolTable balls={balls} className="w-full h-full" />
        <AimOverlay balls={balls} aimAngle={aimAngle} power={power} isAiming={isAiming} />
        {children}
      </div>
    </div>
  );
}
