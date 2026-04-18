'use client';

import { ReactNode } from 'react';
import { Ball } from '@/types';
import { PoolTable } from './PoolTable';
import { AimOverlay } from './AimOverlay';

interface MatchTableProps {
  balls: Ball[];
  aimAngle: number;
  power: number;
  isAiming: boolean;
  children: ReactNode; // input overlay
}

export function MatchTable({ balls, aimAngle, power, isAiming, children }: MatchTableProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="relative w-full"
        style={{ aspectRatio: '2 / 1', maxHeight: '100%' }}
      >
        <PoolTable balls={balls} className="w-full h-full" />
        <AimOverlay balls={balls} aimAngle={aimAngle} power={power} isAiming={isAiming} />
        {children}
      </div>
    </div>
  );
}
