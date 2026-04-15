'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  className?: string;
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const { user } = useUserStore();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'h-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'flex items-center justify-between px-4',
        'border-b border-slate-700/50',
        className
      )}
    >
      {/* Avatar e Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-amber-400 border border-amber-400">
            {user.level}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-semibold truncate max-w-[100px]">
            {user.username}
          </span>
          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(user.currentXP / user.nextLevelXP) * 100}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-green-500"
            />
          </div>
        </div>
      </div>

      {/* Currencies */}
      <div className="flex items-center gap-2">
        {/* Coins */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 bg-slate-800/80 rounded-full px-3 py-1.5 border border-amber-500/30"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-900">$</span>
          </div>
          <span className="text-amber-400 text-sm font-bold">
            {formatNumber(user.currencies.coins)}
          </span>
          <button className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors">
            <Plus className="w-3 h-3 text-slate-900" />
          </button>
        </motion.div>

        {/* Cash */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 bg-slate-800/80 rounded-full px-3 py-1.5 border border-emerald-500/30"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">C</span>
          </div>
          <span className="text-emerald-400 text-sm font-bold">
            {user.currencies.cash}
          </span>
          <button className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors">
            <Plus className="w-3 h-3 text-slate-900" />
          </button>
        </motion.div>
      </div>
    </motion.header>
  );
}
