'use client';

import { useRef, useEffect } from 'react';
import { drawCueOnCanvas } from '@/lib/shop/cueCanvas';
import { getCueDesign } from '@/lib/shop/cueDesigns';

interface CueCanvasProps {
  cueId: string;
  width?: number;
  height?: number;
  className?: string;
}

export function CueCanvas({ cueId, width = 200, height = 40, className }: CueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const design = getCueDesign(cueId);
    if (!design) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCueOnCanvas(ctx, design, canvas.width, canvas.height);
  }, [cueId, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
    />
  );
}
