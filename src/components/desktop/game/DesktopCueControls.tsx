'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Zap, Target, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopCueControlsProps {
  power: number;
  onPowerChange: (power: number) => void;
  disabled?: boolean;
}

export function DesktopCueControls({
  power,
  onPowerChange,
  disabled = false,
}: DesktopCueControlsProps) {
  const t = useTranslations('game');
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPowerChange(Number(e.target.value));
    },
    [onPowerChange]
  );

  const getPowerColor = (value: number) => {
    if (value < 33) return 'from-green-400 to-green-500';
    if (value < 66) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  const getPowerLabel = (value: number) => {
    if (value < 33) return t('soft');
    if (value < 66) return t('medium');
    return t('hard');
  };

  return (
    <div className="h-20 bg-slate-900 border-t border-slate-800 px-8 flex items-center justify-between">
      {/* Power Control */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm font-medium">
              {t('power')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Slider horizontal */}
            <div className="relative w-64 h-8">
              <div className="absolute inset-0 bg-slate-800 rounded-full overflow-hidden">
                {/* Barra de fundo */}
                <div className="absolute inset-y-1 inset-x-1 bg-slate-900 rounded-full" />

                {/* Barra de poder */}
                <motion.div
                  className={cn(
                    'absolute inset-y-1 left-1 rounded-full bg-gradient-to-r',
                    getPowerColor(power)
                  )}
                  style={{ width: `${power}%` }}
                  animate={{ width: `${power}%` }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />

                {/* Input range */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={power}
                  onChange={handleSliderChange}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  disabled={disabled}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {/* Marcadores */}
              <div className="absolute inset-y-0 left-1/4 w-px bg-slate-700/50" />
              <div className="absolute inset-y-0 left-2/4 w-px bg-slate-700/50" />
              <div className="absolute inset-y-0 left-3/4 w-px bg-slate-700/50" />
            </div>

            {/* Valor e label */}
            <div className="flex flex-col items-center min-w-[80px]">
              <motion.span
                animate={{ scale: isDragging ? 1.1 : 1 }}
                className={cn(
                  'text-2xl font-bold',
                  power < 33 && 'text-green-400',
                  power >= 33 && power < 66 && 'text-yellow-400',
                  power >= 66 && 'text-red-400'
                )}
              >
                {power}%
              </motion.span>
              <span className="text-xs text-slate-500">
                {getPowerLabel(power)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Aim Assist & Reset */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Target className="w-5 h-5" />
          <span className="text-sm">{t('aimAssist')}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-sm">{t('reset')}</span>
        </motion.button>
      </div>

      {/* Right - Pull-back hint */}
      <div className="text-right">
        <p className="text-slate-400 text-sm font-medium">Modo 8 Ball Pool</p>
        <p className="text-slate-500 text-xs">Click e arraste na bola branca</p>
      </div>
    </div>
  );
}
