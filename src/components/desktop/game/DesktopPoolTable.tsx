'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DesktopPoolTableProps {
  className?: string;
  aimAngle: number;
  onAimChange: (angle: number) => void;
  power: number;
  isAiming: boolean;
}

export function DesktopPoolTable({
  className,
  aimAngle,
  onAimChange,
  power,
  isAiming,
}: DesktopPoolTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { gameState, updateGameState } = useGameStore();
  const [isDragging, setIsDragging] = useState(false);

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
      // Feltro com gradiente
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0, '#1a5f3f');
      gradient.addColorStop(1, '#0d3d26');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bordas de madeira
      ctx.strokeStyle = '#3d2817';
      ctx.lineWidth = 24;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      // Borda interna
      ctx.strokeStyle = '#2a1b0f';
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

      // Caçapas
      const pockets = [
        { x: 18, y: 18 },
        { x: canvas.width / 2, y: 18 },
        { x: canvas.width - 18, y: 18 },
        { x: 18, y: canvas.height - 18 },
        { x: canvas.width / 2, y: canvas.height - 18 },
        { x: canvas.width - 18, y: canvas.height - 18 },
      ];

      pockets.forEach((pocket) => {
        // Sombra da caçapa
        ctx.beginPath();
        ctx.arc(pocket.x + 2, pocket.y + 2, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Caçapa
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();

        // Brilho da caçapa
        ctx.beginPath();
        ctx.arc(pocket.x - 4, pocket.y - 4, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
      });

      // Marcação de cabeça (head string)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.25, 30);
      ctx.lineTo(canvas.width * 0.25, canvas.height - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spot
      ctx.beginPath();
      ctx.arc(canvas.width * 0.75, canvas.height / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    };

    // Desenhar bolas
    const drawBalls = () => {
      gameState.balls.forEach((ball) => {
        if (ball.inPocket) return;

        // Sombra da bola
        ctx.beginPath();
        ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Bola
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

        // Gradiente 3D
        const ballGradient = ctx.createRadialGradient(
          ball.x - 4,
          ball.y - 4,
          0,
          ball.x,
          ball.y,
          ball.radius
        );

        if (ball.number === 0) {
          // Bola branca
          ballGradient.addColorStop(0, '#ffffff');
          ballGradient.addColorStop(0.5, '#f0f0f0');
          ballGradient.addColorStop(1, '#d0d0d0');
        } else if (ball.number === 8) {
          // Bola 8
          ballGradient.addColorStop(0, '#404040');
          ballGradient.addColorStop(0.5, '#000000');
          ballGradient.addColorStop(1, '#000000');
        } else {
          // Bolas coloridas
          ballGradient.addColorStop(0, '#ffffff');
          ballGradient.addColorStop(0.25, ball.color);
          ballGradient.addColorStop(1, ball.color);
        }

        ctx.fillStyle = ballGradient;
        ctx.fill();

        // Faixa para bolas listradas (9-15)
        if (ball.isStriped && ball.number && ball.number > 8) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.clip();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ball.x - ball.radius, ball.y - 4, ball.radius * 2, 8);

          ctx.restore();
        }

        // Círculo com número
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

        // Brilho
        ctx.beginPath();
        ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
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
        let newVx = ball.vx * 0.988; // Fricção
        let newVy = ball.vy * 0.988;

        // Colisão com paredes
        if (newX < 28 || newX > 772) {
          newVx = -newVx * 0.8; // Perda de energia na parede
          newX = Math.max(28, Math.min(772, newX));
        }
        if (newY < 28 || newY > 372) {
          newVy = -newVy * 0.8;
          newY = Math.max(28, Math.min(372, newY));
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

  // Handlers de mouse para mira
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !gameState) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cueBall = gameState.balls[0];

      const scaleX = 800 / rect.width;
      const scaleY = 400 / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const angle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
      onAimChange(angle);
      setIsDragging(true);
    },
    [gameState, onAimChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current || !gameState) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cueBall = gameState.balls[0];

      const scaleX = 800 / rect.width;
      const scaleY = 400 / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const angle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
      onAimChange(angle);
    },
    [isDragging, gameState, onAimChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!gameState) return null;

  const cueBall = gameState.balls[0];
  const lineLength = 200;
  const endX = cueBall.x + Math.cos(aimAngle) * lineLength;
  const endY = cueBall.y + Math.sin(aimAngle) * lineLength;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full cursor-crosshair', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full rounded-2xl shadow-2xl"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Linha de mira */}
      {isAiming && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          {/* Linha pontilhada */}
          <line
            x1={cueBall.x}
            y1={cueBall.y}
            x2={endX}
            y2={endY}
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="2"
            strokeDasharray="10,5"
          />

          {/* Glow na ponta */}
          <circle
            cx={endX}
            cy={endY}
            r="8"
            fill="rgba(59, 130, 246, 0.6)"
            className="animate-pulse"
          />

          {/* Círculo de precisão */}
          <circle
            cx={endX}
            cy={endY}
            r="15"
            fill="none"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        </svg>
      )}

      {/* Efeito de brilho na mesa */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Indicador de potência */}
      {isAiming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700"
        >
          <span
            className={cn(
              'text-sm font-bold',
              power < 33 && 'text-green-400',
              power >= 33 && power < 66 && 'text-yellow-400',
              power >= 66 && 'text-red-400'
            )}
          >
            Potência: {power}%
          </span>
        </motion.div>
      )}
    </div>
  );
}
