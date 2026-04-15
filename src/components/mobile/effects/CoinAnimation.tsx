'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CoinAnimationProps {
  amount: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete?: () => void;
}

export function CoinAnimation({ amount, startPosition, endPosition, onComplete }: CoinAnimationProps) {
  const [coins, setCoins] = useState<number[]>([]);

  useEffect(() => {
    const coinArray = Array.from({ length: Math.min(amount / 100, 20) }, (_, i) => i);
    setCoins(coinArray);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [amount, onComplete]);

  return (
    <AnimatePresence>
      {coins.map((coin, i) => (
        <motion.div
          key={coin}
          initial={{ 
            x: startPosition.x, 
            y: startPosition.y,
            scale: 0.5,
            opacity: 1 
          }}
          animate={{ 
            x: endPosition.x + (Math.random() - 0.5) * 50, 
            y: endPosition.y + (Math.random() - 0.5) * 30,
            scale: 0.8,
            opacity: 0 
          }}
          transition={{ 
            duration: 1,
            delay: i * 0.05,
            ease: 'easeOut'
          }}
          className="fixed w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 z-50 pointer-events-none flex items-center justify-center"
        >
          <span className="text-[10px] font-bold text-amber-900">$</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
