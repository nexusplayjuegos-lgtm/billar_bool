'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GameModeCard } from './GameModeCard';
import { MOCK_GAME_MODES } from '@/mocks/data';
import { useUserStore } from '@/lib/store';
import { GameMode } from '@/types';
import { cn, getCountryFlag } from '@/lib/utils';
import { useLocale } from '@/hooks';

export function MobileLobbyScreen() {
  const t = useTranslations();
  const { user } = useUserStore();
  const router = useRouter();
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handlePlay = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedMode) {
      router.push(`/${locale}/play/${selectedMode.id}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 landscape:py-2"
      >
        <h1 className="text-xl landscape:text-base font-bold text-white mb-1 landscape:mb-0">
          {t('lobby.welcome', { username: user.username })}
        </h1>
        <div className="flex items-center gap-4 text-sm landscape:text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {t('lobby.onlinePlayers', { count: '12.5K' })}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {user.rank}
          </span>
        </div>
      </motion.div>

      {/* Game Modes Carousel */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 mb-2 landscape:mb-1">
          <h2 className="text-base landscape:text-sm font-semibold text-white">Escolha seu modo</h2>
          <p className="text-sm landscape:text-xs text-slate-400">Deslize para ver mais opções</p>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pinch-zoom',
          }}
        >
          {MOCK_GAME_MODES.map((mode, index) => (
            <div key={mode.id} className="snap-center shrink-0">
              <GameModeCard
                mode={mode}
                index={index}
                isSelected={selectedMode?.id === mode.id}
                onSelect={handleSelectMode}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Top Players Mini */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 py-2 landscape:py-1.5 bg-slate-900/50 border-t border-slate-800"
      >
        <div className="flex items-center justify-between mb-1.5 landscape:mb-1">
          <h3 className="text-sm landscape:text-xs font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 landscape:w-3 landscape:h-3 text-amber-400" />
            {t('lobby.topPlayers')}
          </h3>
          <button className="text-xs landscape:text-[10px] text-blue-400 hover:text-blue-300">
            Ver todos
          </button>
        </div>
        <div className="flex gap-2">
          {[
            { name: 'Efren R.', coins: '999M', country: 'PH' },
            { name: 'Ronnie O.', coins: '875M', country: 'GB' },
            { name: 'Sinucão', coins: '754M', country: 'BR' },
          ].map((player, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-800/50 rounded-lg p-2 landscape:p-1.5 flex items-center gap-2 landscape:gap-1"
            >
              <span className="text-lg landscape:text-base">{getCountryFlag(player.country)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs landscape:text-[10px] font-medium text-white truncate">{player.name}</p>
                <p className="text-[10px] landscape:text-[9px] text-amber-400">{player.coins}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Play FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onPointerDown={handlePlay}
        className={cn(
          'absolute bottom-20 right-4 w-14 h-14 landscape:w-12 landscape:h-12 rounded-full',
          'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
          'flex items-center justify-center shadow-lg shadow-amber-500/30',
          'border-4 border-slate-900 z-20'
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Play className="w-7 h-7 text-slate-900 fill-slate-900" />
        </motion.div>
      </motion.button>
    </div>
  );
}
