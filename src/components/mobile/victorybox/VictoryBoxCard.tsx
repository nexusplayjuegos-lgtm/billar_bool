'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Clock, Package, CheckCircle2, Zap as ZapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playBoxStartUnlock } from '@/lib/audio/gameAudio';
import type { VictoryBox } from '@/types';
import { BOX_COLORS, getTimeRemaining, formatBoxTimer, getAccelerationCost } from '@/types/victoryBox';

interface VictoryBoxCardProps {
  box: VictoryBox;
  hasElite: boolean;
  onStartUnlock: (boxId: string) => void;
  onAccelerate: (boxId: string) => void;
  onOpen: (boxId: string) => void;
}

export function VictoryBoxCard({ box, hasElite, onStartUnlock, onAccelerate, onOpen }: VictoryBoxCardProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(box));
  const colors = BOX_COLORS[box.boxType];
  const isEliteBox = box.isEliteSpeed;

  useEffect(() => {
    if (box.status !== 'unlocking') return;
    const timer = window.setInterval(() => {
      const remaining = getTimeRemaining(box);
      setTimeLeft(remaining);
      if (remaining <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [box]);

  const isReady = timeLeft <= 0 && box.status === 'unlocking';
  const accelCost = timeLeft > 0 ? getAccelerationCost(timeLeft) : 0;

  const handleStartUnlock = useCallback(() => {
    void playBoxStartUnlock();
    onStartUnlock(box.id);
  }, [box.id, onStartUnlock]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl border bg-slate-900/80 backdrop-blur-sm',
        colors.border,
        isReady && 'ring-2 ring-amber-400/50'
      )}
    >
      {/* Box visual */}
      <div
        className={cn(
          'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl mb-3 shadow-lg relative',
          colors.bg,
          colors.glow,
          isEliteBox && 'ring-2 ring-amber-400/50'
        )}
      >
        {isReady ? (
          <motion.div
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Package className="w-8 h-8 text-white" />
          </motion.div>
        ) : box.status === 'locked' ? (
          <Lock className="w-7 h-7 text-white/70" />
        ) : (
          <Clock className="w-7 h-7 text-white/70" />
        )}
        {isEliteBox && (
          <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500 border border-amber-600 shadow-md" title="Velocidade Elite: 3x mais rápido">
            <ZapIcon className="w-3 h-3 text-white" aria-label="Velocidade Elite: 3x mais rápido" />
          </div>
        )}
      </div>

      {/* Type label */}
      <span className={cn('text-xs font-bold uppercase tracking-wider mb-1', colors.text)}>
        {box.boxType}
      </span>

      {/* Timer or status */}
      {box.status === 'locked' && (
        <p className="text-[10px] text-slate-500 mb-2">Bloqueada</p>
      )}

      {box.status === 'unlocking' && !isReady && (
        <div className="flex flex-col items-center gap-1 mb-2">
          <div className="flex items-center gap-1">
            <p className="text-sm font-mono font-bold text-white">{formatBoxTimer(timeLeft)}</p>
            {isEliteBox && (
              <span title="Velocidade Elite: 3x mais rápido">
                <ZapIcon className="w-3.5 h-3.5 text-amber-400" />
              </span>
            )}
          </div>
          <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-r', colors.bg)}
              initial={{ width: '100%' }}
              animate={{
                width: `${Math.max(0, (timeLeft / box.unlockDurationSeconds) * 100)}%`,
              }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      )}

      {isReady && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-bold text-amber-400 mb-2"
        >
          PRONTA!
        </motion.p>
      )}

      {/* Action buttons */}
      {box.status === 'locked' && (
        <button
          onClick={handleStartUnlock}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r transition-all',
            colors.bg,
            'hover:brightness-110 active:scale-95'
          )}
        >
          Desbloquear
        </button>
      )}

      {box.status === 'unlocking' && !isReady && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccelerate(box.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 active:scale-95 transition-all"
          >
            <Zap className="w-3 h-3" />
            {accelCost} C
          </button>
        </div>
      )}

      {isReady && (
        <button
          onClick={() => onOpen(box.id)}
          className={cn(
            'px-5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/30'
          )}
        >
          Abrir!
        </button>
      )}

      {box.status === 'opened' && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <CheckCircle2 className="w-3 h-3" />
          Aberta
        </div>
      )}
    </motion.div>
  );
}
