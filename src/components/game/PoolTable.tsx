'use client';

import { useRef, useEffect, useState } from 'react';
import { Ball } from '@/types';
import { cn } from '@/lib/utils';

interface PoolTableProps {
  balls: Ball[];
  className?: string;
}

export function PoolTable({ balls, className }: PoolTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pocketAnim] = useState(() => new Map<number, number>());

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

    const borderWidth = 18;

    // Borda externa (madeira escura)
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(0, 0, 800, 400);

    // Borda com bevel 3D
    ctx.fillStyle = '#2d1f12';
    ctx.fillRect(4, 4, 800 - 8, 400 - 8);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 800 - 12, 400 - 12);
    ctx.strokeStyle = '#1a0f08';
    ctx.strokeRect(8, 8, 800 - 16, 400 - 16);

    // Feltro azul-turquesa com gradiente
    const feltGradient = ctx.createRadialGradient(400, 200, 0, 400, 200, 350);
    feltGradient.addColorStop(0, '#0d8b9e');
    feltGradient.addColorStop(0.5, '#0a6b7a');
    feltGradient.addColorStop(1, '#074a54');
    ctx.fillStyle = feltGradient;
    ctx.fillRect(borderWidth, borderWidth, 800 - borderWidth * 2, 400 - borderWidth * 2);

    // Borda interna do feltro (borracha)
    ctx.strokeStyle = '#0d3d33';
    ctx.lineWidth = 3;
    ctx.strokeRect(borderWidth + 2, borderWidth + 2, 800 - borderWidth * 2 - 4, 400 - borderWidth * 2 - 4);

    // Linha de borda (cushion line)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(borderWidth + 8, borderWidth + 8, 800 - borderWidth * 2 - 16, 400 - borderWidth * 2 - 16);

    // Diamantes nas bordas
    const diamonds = [150, 250, 350, 450, 550, 650];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    diamonds.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, borderWidth + 4);
      ctx.lineTo(x + 4, borderWidth + 8);
      ctx.lineTo(x, borderWidth + 12);
      ctx.lineTo(x - 4, borderWidth + 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, 400 - borderWidth - 4);
      ctx.lineTo(x + 4, 400 - borderWidth - 8);
      ctx.lineTo(x, 400 - borderWidth - 12);
      ctx.lineTo(x - 4, 400 - borderWidth - 8);
      ctx.closePath();
      ctx.fill();
    });
    const sideDiamonds = [100, 200, 300];
    sideDiamonds.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(borderWidth + 4, y);
      ctx.lineTo(borderWidth + 8, y + 4);
      ctx.lineTo(borderWidth + 12, y);
      ctx.lineTo(borderWidth + 8, y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(800 - borderWidth - 4, y);
      ctx.lineTo(800 - borderWidth - 8, y + 4);
      ctx.lineTo(800 - borderWidth - 12, y);
      ctx.lineTo(800 - borderWidth - 8, y - 4);
      ctx.closePath();
      ctx.fill();
    });

    // Caçapas com profundidade
    const pockets = [
      { x: borderWidth + 2, y: borderWidth + 2 },
      { x: 400, y: borderWidth + 2 },
      { x: 800 - borderWidth - 2, y: borderWidth + 2 },
      { x: borderWidth + 2, y: 400 - borderWidth - 2 },
      { x: 400, y: 400 - borderWidth - 2 },
      { x: 800 - borderWidth - 2, y: 400 - borderWidth - 2 },
    ];

    pockets.forEach((pocket) => {
      ctx.beginPath();
      ctx.arc(pocket.x + 1, pocket.y + 1, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 17, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2a2a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 17, 0, Math.PI * 2);
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pocket.x - 3, pocket.y - 3, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
    });

    // Head string
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(800 * 0.25, borderWidth + 10);
    ctx.lineTo(800 * 0.25, 400 - borderWidth - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Spot
    ctx.beginPath();
    ctx.arc(800 * 0.75, 400 / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // Reflexo sutil no feltro (DEPOIS da mesa, ANTES das bolas)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(800, 0);
    ctx.lineTo(800, 60);
    ctx.lineTo(0, 90);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.fill();

    // === BOLAS ===
    balls.forEach((ball) => {
      if (ball.inPocket) {
        const animKey = ball.id;
        let progress = pocketAnim.get(animKey) ?? 0;
        if (progress < 1) {
          progress += 0.08;
          pocketAnim.set(animKey, progress);
        }
        const scale = Math.max(0, 1 - progress);
        const alpha = Math.max(0, 1 - progress * 1.2);
        if (scale <= 0.01) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(ball.x, ball.y);
        ctx.scale(scale, scale);
        drawBall(ctx, ball);
        ctx.restore();
        return;
      } else {
        pocketAnim.delete(ball.id);
      }

      drawBall(ctx, ball);
    });
  }, [balls, pocketAnim]);

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

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  // Sombra da bola
  ctx.beginPath();
  ctx.arc(ball.x + 2, ball.y + 3, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  // ===== Corpo da bola (SEM rotação) =====
  ctx.save();
  ctx.translate(ball.x, ball.y);

  // Corpo da bola
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);

  const ballGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, ball.radius);

  if (ball.number === 0) {
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.5, '#f0f0f0');
    ballGradient.addColorStop(1, '#c8c8c8');
  } else if (ball.number === 8) {
    ballGradient.addColorStop(0, '#505050');
    ballGradient.addColorStop(0.4, '#202020');
    ballGradient.addColorStop(1, '#000000');
  } else {
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.2, ball.color);
    ballGradient.addColorStop(1, ball.color);
  }

  ctx.fillStyle = ballGradient;
  ctx.fill();

  // Faixa branca para bolas listradas
  if (ball.isStriped && ball.number && ball.number > 8) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-ball.radius, -3.5, ball.radius * 2, 7);
    ctx.restore();
  }

  // Número da bola
  if (ball.number && ball.number > 0) {
    if (ball.number === 8) {
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('8', 0, 0);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.number.toString(), 0, 0);
    }
  }

  // Brilho da bola (specular highlight)
  ctx.beginPath();
  ctx.arc(-3, -3, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  ctx.restore();

  // ===== Marca de rolagem (COM rotação) =====
  if (ball.number !== undefined && ball.number >= 0) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-ball.radius + 2, 0);
    ctx.lineTo(ball.radius - 2, 0);
    ctx.stroke();
    ctx.restore();
  }
}
