'use client';

import { motion } from 'framer-motion';
import { useVibration } from '@/hooks';
import { cn } from '@/lib/utils';

interface ShootButtonProps {
  onShoot: () => void;
  disabled?: boolean;
}

export function ShootButton({ onShoot, disabled }: ShootButtonProps) {
  const { vibrateMedium } = useVibration();

  const handleClick = () => {
    if (!disabled) {
      vibrateMedium();
      onShoot();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative w-20 h-20 rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-orange-500 via-red-500 to-red-600',
        'shadow-lg shadow-red-500/30 border-4 border-slate-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Pulse animation */}
      {!disabled && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-red-500"
        />
      )}

      {/* Inner circle */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
        <span className="text-white font-black text-sm">BATER</span>
      </div>
    </motion.button>
  );
}
