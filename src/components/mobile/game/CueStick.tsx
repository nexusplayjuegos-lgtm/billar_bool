'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CueStickProps {
  angle: number;
  power: number;
  isAiming?: boolean;
  cueName?: string;
  cueColor?: string;
  // Posição da bola branca (em pixels, coordenadas do canvas 800x400)
  whiteBallX?: number;
  whiteBallY?: number;
}

export function CueStick({
  angle,
  power,
  isAiming = true,
  cueName = 'Taco Iniciante',
  cueColor = '#8B5A2B',
  whiteBallX = 200, // Posição padrão da bola branca
  whiteBallY = 200,
}: CueStickProps) {
  // Calcula o recuo baseado na potência (quanto maior, mais recuado)
  const pullback = Math.min(power * 0.8, 60);

  if (!isAiming) return null;

  // Converter coordenadas do canvas (800x400) para porcentagem do container
  const leftPercent = (whiteBallX / 800) * 100;
  const topPercent = (whiteBallY / 400) * 100;

  // O taco tem 280px de largura, a ponta está a ~240px da origem (direita)
  // Ajustamos para que a ponta do taco fique na posição da bola branca
  const cueLength = 280;
  const tipOffset = 240; // Distância da origem até a ponta do taco

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${cueLength}px`,
        height: '12px',
        // A ponta do taco deve estar na posição da bola
        // O taco é desenhado da direita para a esquerda (ponta à direita)
        marginLeft: `-${tipOffset}px`,
        marginTop: '-6px',
        transform: `rotate(${angle}rad)`,
        transformOrigin: `${tipOffset}px center`,
        zIndex: 5, // Atrás das bolas (que estão no canvas)
      }}
    >
      {/* Container do taco com animação de recuo */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          x: -pullback,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Corpo do taco */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 h-3 rounded-full shadow-xl"
          style={{
            width: '240px',
            background: `linear-gradient(180deg,
              ${cueColor} 0%,
              ${adjustBrightness(cueColor, 20)} 30%,
              ${cueColor} 50%,
              ${adjustBrightness(cueColor, -20)} 70%,
              ${cueColor} 100%
            )`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
          }}
        >
          {/* Anéis decorativos */}
          <div
            className="absolute left-4 top-0 bottom-0 w-1 rounded-full"
            style={{ background: 'linear-gradient(180deg, #C0C0C0, #808080, #C0C0C0)' }}
          />
          <div
            className="absolute left-8 top-0 bottom-0 w-0.5 rounded-full"
            style={{ background: 'linear-gradient(180deg, #FFD700, #B8860B, #FFD700)' }}
          />

          {/* Textura de madeira */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.1) 2px,
                rgba(0,0,0,0.1) 4px
              )`,
            }}
          />
        </div>

        {/* Ponta do taco (couro) */}
        <div
          className="absolute right-[240px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #4A90A4, #1E3A5F)',
            boxShadow: '0 0 8px rgba(74, 144, 164, 0.5), inset 0 0 4px rgba(255,255,255,0.3)',
          }}
        >
          {/* Brilho na ponta */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-blue-300 opacity-60" />
        </div>

        {/* Cabo do taco (empunhadura) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 rounded-l-lg rounded-r-md shadow-lg"
          style={{
            width: '40px',
            background: `linear-gradient(180deg,
              ${adjustBrightness(cueColor, -30)} 0%,
              ${adjustBrightness(cueColor, -50)} 50%,
              ${adjustBrightness(cueColor, -40)} 100%
            )`,
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Textura de borracha/linho no cabo */}
          <div
            className="absolute inset-0 rounded-l-lg rounded-r-md opacity-50"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(0,0,0,0.2) 1px,
                rgba(0,0,0,0.2) 2px
              )`,
            }}
          />
        </div>

        {/* Indicador de força */}
        <div
          className={cn(
            'absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors',
            power < 33 && 'bg-green-500/80 text-white',
            power >= 33 && power < 66 && 'bg-yellow-500/80 text-white',
            power >= 66 && 'bg-red-500/80 text-white'
          )}
        >
          {power}%
        </div>
      </motion.div>

      {/* Nome do taco */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 whitespace-nowrap">
        {cueName}
      </div>
    </div>
  );
}

// Função auxiliar para ajustar brilho da cor
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
