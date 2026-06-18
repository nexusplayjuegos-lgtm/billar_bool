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
  showIdleCue?: boolean;
  cueStrikeActive?: boolean;
  isBreakShot?: boolean;
  opponentAim?: { angle: number; power: number } | null;
  children: ReactNode;
  scale?: number;
  playerType?: 'solid' | 'stripe' | null;
  gameMode?: '8ball' | 'brazilian';
  tableId?: string;
  cueId?: string;
  onSizeChange?: (size: { width: number; height: number }) => void;
  isMobile?: boolean; // <- Nova prop para condicionar o fator mobile
}

export function MatchTable({
  balls,
  aimAngle,
  power,
  isAiming,
  showIdleCue,
  cueStrikeActive = false,
  isBreakShot,
  opponentAim,
  children,
  scale = 1,
  playerType,
  gameMode,
  tableId,
  cueId,
  onSizeChange,
  isMobile = false, // <- Default false (desktop) para segurança
}: MatchTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const styles = window.getComputedStyle(el);
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const pw = el.clientWidth - horizontalPadding;
      const ph = el.clientHeight - verticalPadding;
      if (pw <= 0 || ph <= 0) return;
      const baseScale = Math.min(pw / 800, ph / 400) * (isMobile ? 0.9 : 1); // <- Aplica fator 0.9 apenas em mobile
      const width = Math.max(1, 800 * baseScale);
      const height = Math.max(1, 400 * baseScale);
      const nextSize = { width, height };
      setSize((current) => (current.width === width && current.height === height ? current : nextSize));
      onSizeChange?.(nextSize);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSizeChange]);

  return (
    <div ref={containerRef} className="match-table-stage w-full h-full flex items-center justify-center">
      <div
        className="match-table-frame relative"
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="match-table-chrome pointer-events-none absolute inset-[-10px] z-[-1]" />
        <div className="match-table-corner match-table-corner-tl" />
        <div className="match-table-corner match-table-corner-tr" />
        <div className="match-table-corner match-table-corner-bl" />
        <div className="match-table-corner match-table-corner-br" />
        <PoolTable balls={balls} className="w-full h-full" tableId={tableId} />
        <AimOverlay balls={balls} aimAngle={aimAngle} power={power} isAiming={isAiming} showIdleCue={showIdleCue} cueStrikeActive={cueStrikeActive} isBreakShot={isBreakShot} playerType={playerType} gameMode={gameMode} cueId={cueId} />
        {opponentAim && (
          <AimOverlay
            balls={balls}
            aimAngle={opponentAim.angle}
            power={opponentAim.power}
            isAiming
            isBreakShot={isBreakShot}
            variant="opponent"
          />
        )}
        {children}
      </div>
    </div>
  );
}
