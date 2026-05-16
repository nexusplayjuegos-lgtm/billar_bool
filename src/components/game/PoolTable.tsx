'use client';

import { useRef, useEffect, useState } from 'react';
import { Ball } from '@/types';
import { cn } from '@/lib/utils';
import { getTableDesign } from '@/lib/shop/tableDesigns';

interface PoolTableProps {
  balls: Ball[];
  className?: string;
  tableId?: string;
}

export function PoolTable({ balls, className, tableId = 'classic-green' }: PoolTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pocketAnim] = useState(() => new Map<number, number>());
  const particlesRef = useRef(new PocketParticleSystem());
  const pocketedRef = useRef(new Set<number>());
  const animationFrameRef = useRef<number | null>(null);
  const [, setParticleFrame] = useState(0);

  useEffect(() => {
    if (animationFrameRef.current !== null || particlesRef.current.isIdle()) return;

    const animate = () => {
      particlesRef.current.update();
      setParticleFrame((frame) => frame + 1);
      if (particlesRef.current.isIdle()) {
        animationFrameRef.current = null;
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [balls]);

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
    const tableDesign = getTableDesign(tableId) ?? getTableDesign('classic-green');
    const feltColor = tableDesign?.feltColor ?? '#0a6b7a';
    const cushionColor = tableDesign?.cushionColor ?? '#0d3d33';
    const woodColor = tableDesign?.woodColor ?? '#2d1f12';
    const lineColor = tableDesign?.lineColor ?? '#ffffff';

    ctx.fillStyle = '#1a1008';
    ctx.fillRect(0, 0, 800, 400);

    ctx.fillStyle = woodColor;
    ctx.fillRect(4, 4, 800 - 8, 400 - 8);
    ctx.strokeStyle = cushionColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 800 - 12, 400 - 12);
    ctx.strokeStyle = '#1a0f08';
    ctx.strokeRect(8, 8, 800 - 16, 400 - 16);

    const feltGradient = ctx.createRadialGradient(400, 200, 0, 400, 200, 350);
    feltGradient.addColorStop(0, feltColor);
    feltGradient.addColorStop(0.5, feltColor);
    feltGradient.addColorStop(1, cushionColor);
    ctx.fillStyle = feltGradient;
    ctx.fillRect(borderWidth, borderWidth, 800 - borderWidth * 2, 400 - borderWidth * 2);

    ctx.strokeStyle = cushionColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(borderWidth + 2, borderWidth + 2, 800 - borderWidth * 2 - 4, 400 - borderWidth * 2 - 4);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(borderWidth + 8, borderWidth + 8, 800 - borderWidth * 2 - 16, 400 - borderWidth * 2 - 16);

    const diamonds = [150, 250, 350, 450, 550, 650];
    ctx.fillStyle = `${lineColor}66`;
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

    ctx.strokeStyle = `${lineColor}55`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(800 * 0.25, borderWidth + 10);
    ctx.lineTo(800 * 0.25, 400 - borderWidth - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(800 * 0.75, 400 / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = `${lineColor}66`;
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
        if (!pocketedRef.current.has(ball.id)) {
          pocketedRef.current.add(ball.id);
          particlesRef.current.emit(ball.x, ball.y);
        }
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
        pocketedRef.current.delete(ball.id);
      }

      drawBall(ctx, ball);
    });

    particlesRef.current.render(ctx);
  }, [balls, pocketAnim, tableId]);

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
  const {
    x,
    y,
    radius,
    color,
    number,
    isStriped,
    rollX = 0,
    rollY = 0,
    rollPhase,
    rollDirX,
    rollDirY,
  } = ball;
  const wobble = ball.wobble ?? 0;
  const wobblePhase = ball.wobblePhase ?? 0;
  const drawX = x + Math.sin(wobblePhase) * wobble;
  const drawY = y + Math.cos(wobblePhase * 1.3) * wobble;
  const fallbackRollLength = Math.hypot(rollX, rollY);
  const phase = rollPhase ?? fallbackRollLength;
  const dirLength = Math.hypot(rollDirX ?? 0, rollDirY ?? 0);
  const fallbackDirLength = fallbackRollLength || 1;
  const directionX = dirLength > 0 ? (rollDirX ?? 1) / dirLength : rollX / fallbackDirLength;
  const directionY = dirLength > 0 ? (rollDirY ?? 0) / dirLength : rollY / fallbackDirLength;

  // ── Sombra ──────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.arc(drawX + 1, drawY + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(drawX, drawY);

  // Clip em círculo — mascara tudo o que sai da bola
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  // ── Cor base ──
  if (number === 0) {
    // Bola branca
    const g = ctx.createRadialGradient(
      -radius * 0.2,
      -radius * 0.2,
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
    const bodyGradient = ctx.createRadialGradient(
      -radius * 0.35,
      -radius * 0.35,
      radius * 0.08,
      0,
      0,
      radius
    );
    bodyGradient.addColorStop(0, lightenColor(color, 42));
    bodyGradient.addColorStop(0.35, color);
    bodyGradient.addColorStop(1, darkenColor(color, 32));
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  }

  if (isStriped && number && number > 8) {
    drawProjectedStripe(ctx, radius, phase, directionX, directionY);
  }

  if (number && number > 0) {
    drawNumberDecal(ctx, radius, number, phase, directionX, directionY);
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

  ctx.beginPath();
  ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── LAYER 3: Highlight especular fixo (topo esquerdo) ───────────
  // Não se move — ancora visualmente a bola como esfera sob luz
  ctx.save();
  ctx.translate(drawX, drawY);

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

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

function rotateVectorAroundAxis(vector: Vector3, axis: Vector3, angle: number): Vector3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = vector.x * axis.x + vector.y * axis.y + vector.z * axis.z;
  const crossX = axis.y * vector.z - axis.z * vector.y;
  const crossY = axis.z * vector.x - axis.x * vector.z;
  const crossZ = axis.x * vector.y - axis.y * vector.x;

  return {
    x: vector.x * cos + crossX * sin + axis.x * dot * (1 - cos),
    y: vector.y * cos + crossY * sin + axis.y * dot * (1 - cos),
    z: vector.z * cos + crossZ * sin + axis.z * dot * (1 - cos),
  };
}

function getRollAxis(directionX: number, directionY: number): Vector3 {
  return { x: -directionY, y: directionX, z: 0 };
}

function drawProjectedStripe(
  ctx: CanvasRenderingContext2D,
  radius: number,
  phase: number,
  directionX: number,
  directionY: number
) {
  const axis = getRollAxis(directionX, directionY);
  const stripeHalfWidth = 0.34;
  const stripeFeather = 0.08;
  const pixelRadius = Math.ceil(radius);

  ctx.save();

  for (let py = -pixelRadius; py <= pixelRadius; py++) {
    for (let px = -pixelRadius; px <= pixelRadius; px++) {
      const sphereX = px / radius;
      const sphereY = py / radius;
      const distanceSq = sphereX * sphereX + sphereY * sphereY;
      if (distanceSq > 1) continue;

      const sphereZ = Math.sqrt(1 - distanceSq);
      const localPoint = rotateVectorAroundAxis(
        { x: sphereX, y: sphereY, z: sphereZ },
        axis,
        -phase
      );
      const stripeDistance = Math.abs(localPoint.y);
      if (stripeDistance > stripeHalfWidth + stripeFeather) continue;

      const edgeAlpha =
        stripeDistance <= stripeHalfWidth
          ? 1
          : 1 - (stripeDistance - stripeHalfWidth) / stripeFeather;
      const lightWrap = 0.72 + sphereZ * 0.28;
      ctx.fillStyle = `rgba(255,255,255,${edgeAlpha * lightWrap})`;
      ctx.fillRect(px, py, 1, 1);
    }
  }

  ctx.restore();
}

function drawNumberDecal(
  ctx: CanvasRenderingContext2D,
  radius: number,
  number: number,
  phase: number,
  directionX: number,
  directionY: number
) {
  const axis = getRollAxis(directionX, directionY);
  const surfacePoint = rotateVectorAroundAxis({ x: 0, y: 0, z: 1 }, axis, phase);
  const decalX = surfacePoint.x * radius * 0.28;
  const decalY = surfacePoint.y * radius * 0.28;
  const decalScale = 0.9 + Math.max(0, surfacePoint.z) * 0.1;

  ctx.save();
  ctx.translate(decalX, decalY);
  ctx.scale(decalScale, decalScale);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.43, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fill();

  ctx.fillStyle = '#111111';
  ctx.font = `bold ${Math.round(radius * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), 0, 0);
  ctx.restore();
}

interface PocketParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

class PocketParticleSystem {
  private particles: PocketParticle[] = [];
  private colors = ['#fbbf24', '#f97316', '#ef4444', '#ffffff'];

  emit(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.8) * 4,
        life: 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        size: Math.random() * 2.5 + 1.5,
      });
    }
  }

  update() {
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.12;
      particle.vx *= 0.98;
      particle.life -= 0.025;
      return particle.life > 0;
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  isIdle() {
    return this.particles.length === 0;
  }
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function adjustColor(hex: string, amount: number) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `#${clampColor(r + amount).toString(16).padStart(2, '0')}${clampColor(g + amount).toString(16).padStart(2, '0')}${clampColor(b + amount).toString(16).padStart(2, '0')}`;
}

function lightenColor(hex: string, amount: number) {
  return adjustColor(hex, amount);
}

function darkenColor(hex: string, amount: number) {
  return adjustColor(hex, -amount);
}
