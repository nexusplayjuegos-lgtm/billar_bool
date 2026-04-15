'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PowerSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function PowerSlider({ value, onChange }: PowerSliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getColor = (v: number) => {
    if (v < 33) return 'from-green-400 to-green-500';
    if (v < 66) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-white/60 text-xs font-medium">FORÇA</span>

      <div className="relative h-40 w-12 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        {/* Barra de fundo */}
        <div className="absolute inset-x-2 top-2 bottom-2 bg-slate-900 rounded-full" />

        {/* Barra de poder */}
        <motion.div
          className={cn(
            'absolute inset-x-2 bottom-2 rounded-full bg-gradient-to-t',
            getColor(value)
          )}
          style={{ height: `${value}%` }}
          animate={{ height: `${value}%` }}
          transition={{ type: 'spring', stiffness: 300 }}
        />

        {/* Slider input */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ WebkitAppearance: 'slider-vertical' }}
        />

        {/* Marcadores */}
        <div className="absolute inset-x-0 top-1/4 h-px bg-slate-700/50" />
        <div className="absolute inset-x-0 top-2/4 h-px bg-slate-700/50" />
        <div className="absolute inset-x-0 top-3/4 h-px bg-slate-700/50" />
      </div>

      {/* Valor */}
      <motion.span
        animate={{ scale: isDragging ? 1.2 : 1 }}
        className={cn(
          'text-lg font-bold',
          value < 33 && 'text-green-400',
          value >= 33 && value < 66 && 'text-yellow-400',
          value >= 66 && 'text-red-400'
        )}
      >
        {value}%
      </motion.span>
    </div>
  );
}
