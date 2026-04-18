'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

const COLORS = [
  '#fbbf24', '#f59e0b', '#ef4444', '#3b82f6',
  '#10b981', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#84cc16',
];

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles
    const spawn = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: canvas.width / (2 * window.devicePixelRatio),
          y: canvas.height / (2 * window.devicePixelRatio) - 50,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 1.2) * 14,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 4,
          opacity: 1,
        });
      }
      return particles;
    };

    particlesRef.current = spawn();

    const gravity = 0.35;
    const drag = 0.98;

    const animate = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      let alive = 0;
      for (const p of particlesRef.current) {
        if (p.opacity <= 0) continue;
        alive++;

        p.vx *= drag;
        p.vy *= drag;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.005;

        if (p.y > h - p.size) {
          p.y = h - p.size;
          p.vy *= -0.4;
          p.vx *= 0.7;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (alive > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
