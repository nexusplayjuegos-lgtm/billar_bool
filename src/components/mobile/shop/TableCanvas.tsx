'use client';

import { useRef, useEffect } from 'react';
import { drawTableOnCanvas } from '@/lib/shop/tableCanvas';
import { getTableDesign } from '@/lib/shop/tableDesigns';

interface TableCanvasProps {
  tableId: string;
  rarity?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function TableCanvas({ tableId, rarity, width = 200, height = 120, className }: TableCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const design = getTableDesign(tableId, rarity);
    if (!design) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTableOnCanvas(ctx, design, canvas.width, canvas.height);
  }, [tableId, width, height, rarity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
    />
  );
}
