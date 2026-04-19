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

    ctx.fillStyle = '#1a1008';
    ctx.fillRect(0, 0, 800, 400);

    ctx.fillStyle = '#2d1f12';
    ctx.fillRect(4, 4, 800 - 8, 400 - 8);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 800 - 12, 400 - 12);
    ctx.strokeStyle = '#1a0f08';
    ctx.strokeRect(8, 8, 800 - 16, 400 - 16);

    const feltGradient = ctx.createRadialGradient(400, 200, 0, 400, 200, 350);
    feltGradient.addColorStop(0, '#0d8b9e');
    feltGradient.addColorStop(0.5, '#0a6b7a');
    feltGradient.addColorStop(1, '#074a54');
    ctx.fillStyle = feltGradient;
    ctx.fillRect(borderWidth, borderWidth, 800 - borderWidth * 2, 400 - borderWidth * 2);

    ctx.strokeStyle = '#0d3d33';
    ctx.lineWidth = 3;
    ctx.strokeRect(borderWidth + 2, borderWidth + 2, 800 - borderWidth * 2 - 4, 400 - borderWidth * 2 - 4);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(borderWidth + 8, borderWidth + 8, 800 - borderWidth * 2 - 16, 400 - borderWidth * 2 - 16);

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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(800 * 0.25, borderWidth + 10);
    ctx.lineTo(800 * 0.25, 400 - borderWidth - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(800 * 0.75, 400 / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

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
        ctx.translate(-ball.x, -ball.y);
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
  const { x, y, radius, color, number, isStriped, vx, vy, rotation } = ball;

  // ── Sombra ──────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(x + 2, y + 3, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  // ── LAYER 1: Textura interna com scroll ─────────────────────────
  // Técnica: clip em círculo + deslizar padrão na direcção do movimento
  // Cria ilusão real de rolamento sem sprite sheet
  const speed = Math.sqrt(vx * vx + vy * vy);
  const isMoving = speed > 0.05;

  // scrollX/scrollY: offset acumulado da textura interna
  // rotation acumula distância percorrida no engine de física
  let scrollX = 0;
  let scrollY = 0;
  if (isMoving) {
    const dirX = vx / speed;
    const dirY = vy / speed;
    // Ciclo da textura = circunferência da bola (2πr)
    const circumference = radius * Math.PI * 2;
    const scrollDist = rotation % circumference;
    scrollX = dirX * scrollDist;
    scrollY = dirY * scrollDist;
  }

  ctx.save();
  ctx.translate(x, y);

  // Clip em círculo — mascara tudo o que sai da bola
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  // ── Cor base ──
  if (number === 0) {
    // Bola branca
    const g = ctx.createRadialGradient(
      scrollX * 0.4 - radius * 0.2,
      scrollY * 0.4 - radius * 0.2,
      0,
      0, 0, radius
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#eeeeee');
    g.addColorStop(1, '#cccccc');
    ctx.fillStyle = g;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  } else if (number === 8) {
    ctx.fillStyle = '#111111';
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  }

  // ── Faixa branca para bolas listradas (rola com o movimento) ──
  if (isStriped && number && number > 8) {
    const circumference = radius * Math.PI * 2;
    // Offset cíclico da faixa na direcção do movimento
    const stripeOffset = isMoving
      ? (rotation % circumference) * (vy / (speed || 1))
      : 0;
    const stripeH = radius * 0.65;

    ctx.fillStyle = '#ffffff';
    // Faixa com wrap cíclico para não "saltar"
    for (let i = -1; i <= 1; i++) {
      const sy = stripeOffset + i * circumference;
      ctx.fillRect(-radius, sy - stripeH / 2, radius * 2, stripeH);
    }
  }

  // ── Overlay de sombra esférica (FIXO — dá curvatura 3D) ──
  const sphereShade = ctx.createRadialGradient(
    radius * 0.1, radius * 0.1, radius * 0.05,
    0, 0, radius
  );
  sphereShade.addColorStop(0, 'rgba(255,255,255,0.0)');
  sphereShade.addColorStop(0.55, 'rgba(0,0,0,0.0)');
  sphereShade.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = sphereShade;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

  ctx.restore(); // remove clip

  // ── LAYER 2: Número da bola (fixo no centro) ────────────────────
  ctx.save();
  ctx.translate(x, y);

  if (number && number > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.font = `bold ${Math.round(radius * 0.7)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 0, 0);
  }

  ctx.restore();

  // ── LAYER 3: Highlight especular fixo (topo esquerdo) ───────────
  // Não se move — ancora visualmente a bola como esfera sob luz
  ctx.save();
  ctx.translate(x, y);

  const highlightGrad = ctx.createRadialGradient(
    -radius * 0.38, -radius * 0.38, 0,
    -radius * 0.15, -radius * 0.15, radius * 0.6
  );
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
  highlightGrad.addColorStop(0.35, 'rgba(255,255,255,0.25)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0.0)');

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  // Hotspot pequeno e brilhante
  ctx.beginPath();
  ctx.arc(-radius * 0.33, -radius * 0.33, radius * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.restore();
}