'use client';

import { motion } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  className?: string;
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const { profile, signOut } = useUserStore();

  // Se não tiver profile (convidado), mostrar valores padrão
  const username = profile?.username || 'Convidado';
  const level = profile?.level || 1;
  const coins = profile?.coins || 5000;
  const cash = profile?.cash || 0;
  const xp = profile?.xp || 0;
  const xpToNext = profile?.xp_to_next || 1000;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'h-12 landscape:h-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'flex items-center justify-between px-3',
        'border-b border-slate-700/50',
        className
      )}
    >
      {/* Avatar e Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 landscape:w-7 landscape:h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xs">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-amber-400 border border-amber-400">
            {level}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm landscape:text-xs font-semibold truncate max-w-[100px]">
            {username}
          </span>
          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(xp / xpToNext) * 100}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-green-500"
            />
          </div>
        </div>
      </div>

      {/* Currencies + Logout */}
      <div className="flex items-center gap-2">
        {/* Coins */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 bg-slate-800/80 rounded-full px-2.5 py-1 border border-amber-500/30"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-900">$</span>
          </div>
          <span className="text-amber-400 text-sm landscape:text-xs font-bold">
            {formatNumber(coins)}
          </span>
          <button className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors">
            <Plus className="w-3 h-3 text-slate-900" />
          </button>
        </motion.div>

        {/* Cash */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 bg-slate-800/80 rounded-full px-2.5 py-1 border border-emerald-500/30"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">C</span>
          </div>
          <span className="text-emerald-400 text-sm landscape:text-xs font-bold">
            {cash}
          </span>
          <button className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors">
            <Plus className="w-3 h-3 text-slate-900" />
          </button>
        </motion.div>

        {/* Logout Button (apenas se logado) */}
        {profile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={signOut}
            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}