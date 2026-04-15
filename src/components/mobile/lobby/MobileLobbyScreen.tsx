'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, TrendingUp, Users } from 'lucide-react';
import { GameModeCard } from './GameModeCard';
import { MOCK_GAME_MODES } from '@/mocks/data';
import { useUserStore } from '@/lib/store';
import { useGameStore } from '@/lib/store';
import { GameMode } from '@/types';
import { cn } from '@/lib/utils';

export function MobileLobbyScreen() {
  const t = useTranslations();
  const { user } = useUserStore();
  const { startGame } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handlePlay = () => {
    if (selectedMode) {
      startGame(selectedMode.id, selectedMode.entryFee.coins, selectedMode.reward.win);
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
        className="px-4 py-4"
      >
        <h1 className="text-2xl font-bold text-white mb-1">
          {t('lobby.welcome', { username: user.username })}
        </h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
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
        <div className="px-4 mb-3">
          <h2 className="text-lg font-semibold text-white">Escolha seu modo</h2>
          <p className="text-sm text-slate-400">Deslize para ver mais opções</p>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MOCK_GAME_MODES.map((mode, index) => (
            <div key={mode.id} className="snap-center">
              <GameModeCard
                mode={mode}
                index={index}
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
        className="px-4 py-3 bg-slate-900/50 border-t border-slate-800"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            {t('lobby.topPlayers')}
          </h3>
          <button className="text-xs text-blue-400 hover:text-blue-300">
            Ver todos
          </button>
        </div>
        <div className="flex gap-2">
          {[
            { name: 'Efren R.', coins: '999M', flag: '🇵🇭' },
            { name: 'Ronnie O.', coins: '875M', flag: '🇬🇧' },
            { name: 'Sinucão', coins: '754M', flag: '🇧🇷' },
          ].map((player, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-800/50 rounded-lg p-2 flex items-center gap-2"
            >
              <span className="text-lg">{player.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{player.name}</p>
                <p className="text-[10px] text-amber-400">{player.coins}</p>
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
        onClick={handlePlay}
        className={cn(
          'absolute bottom-20 right-4 w-16 h-16 rounded-full',
          'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
          'flex items-center justify-center shadow-lg shadow-amber-500/30',
          'border-4 border-slate-900'
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
