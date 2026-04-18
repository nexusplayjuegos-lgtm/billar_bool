'use client';

import { useRef, useEffect } from 'react';
import { Ball } from '@/types';
import { cn } from '@/lib/utils';

interface PoolTableProps {
  balls: Ball[];
  className?: string;
}

export function PoolTable({ balls, className }: PoolTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    if (canvas.width !== 800 * dpr || canvas.height !== 400 * dpr) {
      canvas.width = 800 * dpr;
      canvas.height = 400 * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 800, 400);

    // Feltro
    const gradient = ctx.createRadialGradient(400, 200, 0, 400, 200, 400);
    gradient.addColorStop(0, '#1a5f3f');
    gradient.addColorStop(1, '#0d3d26');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Bordas
    ctx.strokeStyle = '#3d2817';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, 800 - 24, 400 - 24);
    ctx.strokeStyle = '#2a1b0f';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, 800 - 44, 400 - 44);

    // Caçapas
    const pockets = [
      { x: 18, y: 18 },
      { x: 400, y: 18 },
      { x: 800 - 18, y: 18 },
      { x: 18, y: 400 - 18 },
      { x: 400, y: 400 - 18 },
      { x: 800 - 18, y: 400 - 18 },
    ];

    pockets.forEach((pocket) => {
      ctx.beginPath();
      ctx.arc(pocket.x + 2, pocket.y + 2, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pocket.x - 4, pocket.y - 4, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    });

    // Head string
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(800 * 0.25, 30);
    ctx.lineTo(800 * 0.25, 400 - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Spot
    ctx.beginPath();
    ctx.arc(800 * 0.75, 400 / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Bolas
    balls.forEach((ball) => {
      if (ball.inPocket) return;

      ctx.beginPath();
      ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

      const ballGradient = ctx.createRadialGradient(
        ball.x - 4,
        ball.y - 4,
        0,
        ball.x,
        ball.y,
        ball.radius
      );

      if (ball.number === 0) {
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.5, '#f0f0f0');
        ballGradient.addColorStop(1, '#d0d0d0');
      } else if (ball.number === 8) {
        ballGradient.addColorStop(0, '#404040');
        ballGradient.addColorStop(0.5, '#000000');
        ballGradient.addColorStop(1, '#000000');
      } else {
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.25, ball.color);
        ballGradient.addColorStop(1, ball.color);
      }

      ctx.fillStyle = ballGradient;
      ctx.fill();

      if (ball.isStriped && ball.number && ball.number > 8) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ball.x - ball.radius, ball.y - 4, ball.radius * 2, 8);
        ctx.restore();
      }

      if (ball.number && ball.number > 0) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.fillStyle = ball.number === 8 ? 'white' : 'black';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number.toString(), ball.x, ball.y);
      }

      ctx.beginPath();
      ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    });
  }, [balls]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full rounded-2xl shadow-2xl"
        style={{ imageRendering: 'auto' }}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
