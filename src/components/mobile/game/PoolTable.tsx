'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PoolTableProps {
  className?: string;
}

export function PoolTable({ className }: PoolTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, updateGameState } = useGameStore();

  // Renderização do canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar mesa
    const drawTable = () => {
      // Feltro
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, '#1a5f3f');
      gradient.addColorStop(1, '#0d3d26');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bordas
      ctx.strokeStyle = '#3d2817';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Caçapas
      const pockets = [
        { x: 15, y: 15 },
        { x: canvas.width / 2, y: 15 },
        { x: canvas.width - 15, y: 15 },
        { x: 15, y: canvas.height - 15 },
        { x: canvas.width / 2, y: canvas.height - 15 },
        { x: canvas.width - 15, y: canvas.height - 15 },
      ];

      pockets.forEach((pocket) => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
      });
    };

    // Desenhar bolas
    const drawBalls = () => {
      gameState.balls.forEach((ball) => {
        if (ball.inPocket) return;

        // Sombra
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Bola
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

        // Gradiente 3D
        const ballGradient = ctx.createRadialGradient(
          ball.x - 3, ball.y - 3, 0,
          ball.x, ball.y, ball.radius
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.3, ball.color);
        ballGradient.addColorStop(1, ball.color);

        ctx.fillStyle = ballGradient;
        ctx.fill();

        // Número
        if (ball.number) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();

          ctx.fillStyle = 'black';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }

        // Brilho
        ctx.beginPath();
        ctx.arc(ball.x - 3, ball.y - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      });
    };

    drawTable();
    drawBalls();
  }, [gameState]);

  // Loop de física
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      const newBalls = gameState.balls.map((ball) => {
        if (ball.inPocket) return ball;

        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newVx = ball.vx * 0.985; // Fricção
        let newVy = ball.vy * 0.985;

        // Colisão com paredes
        if (newX < 25 || newX > 775) {
          newVx = -newVx;
          newX = Math.max(25, Math.min(775, newX));
        }
        if (newY < 25 || newY > 375) {
          newVy = -newVy;
          newY = Math.max(25, Math.min(375, newY));
        }

        // Parar se muito lento
        if (Math.abs(newVx) < 0.05) newVx = 0;
        if (Math.abs(newVy) < 0.05) newVy = 0;

        return {
          ...ball,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
        };
      });

      updateGameState({ balls: newBalls });
    }, 16);

    return () => clearInterval(interval);
  }, [gameState, updateGameState]);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full rounded-xl shadow-2xl"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Efeito de brilho na mesa */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
