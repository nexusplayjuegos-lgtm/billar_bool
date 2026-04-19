'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, TrendingUp, Users, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOCK_GAME_MODES, MOCK_LEADERBOARD } from '@/mocks/data';
import { useUserStore, useGameStore } from '@/lib/store';
import { formatNumber, getCountryFlag } from '@/lib/utils';
import { useLocale } from '@/hooks';

export function DesktopLobbyScreen() {
  const t = useTranslations();
  const { user, removeCoins } = useUserStore();
  const { startGame } = useGameStore();
  const router = useRouter();
  const { locale } = useLocale();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white mb-2">
            Bem-vindo, {user.username}!
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Escolha seu modo de jogo e domine a mesa
          </p>
          <button
            onClick={() => {
              const mode = MOCK_GAME_MODES[0];
              if (user.currencies.coins >= mode.entryFee.coins) {
                removeCoins(mode.entryFee.coins);
                startGame(mode.id, mode.type, mode.entryFee.coins, mode.reward.win);
                router.push(`/${locale}/play/${mode.id}`);
              }
            }}
            className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl flex items-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Play className="w-5 h-5" />
            Jogar Agora
          </button>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Vitórias', value: user.stats.wins, icon: Star, color: 'text-amber-400' },
          { label: 'Win Rate', value: `${user.stats.winRate}%`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Moedas', value: formatNumber(user.currencies.coins), icon: () => <div className="w-5 h-5 rounded-full bg-amber-400" />, color: 'text-amber-400' },
          { label: 'Amigos', value: user.social.friends, icon: Users, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-slate-400 text-sm">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Game Modes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Modos de Jogo</h2>
        <div className="grid grid-cols-3 gap-4">
          {MOCK_GAME_MODES.slice(0, 3).map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (user.currencies.coins >= mode.entryFee.coins) {
                  removeCoins(mode.entryFee.coins);
                  startGame(mode.id, mode.type, mode.entryFee.coins, mode.reward.win);
                  router.push(`/${locale}/play/${mode.id}`);
                }
              }}
              className="bg-slate-800/50 rounded-xl p-4 cursor-pointer hover:bg-slate-800 transition-colors"
              style={{ borderLeft: `4px solid ${mode.color}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">
                  {mode.type === '8ball' && '🎱'}
                  {mode.type === 'brazilian' && '🇧🇷'}
                  {mode.type === 'snooker' && '👑'}
                </span>
                <span className="text-xs text-slate-400">Nv. {mode.minLevel}+</span>
              </div>
              <h3 className="text-white font-bold mb-1">
                {t(`modes.${mode.id.split('_')[1]}.name`)}
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                {t(`modes.${mode.id.split('_')[1]}.subtitle`)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-sm font-medium">
                  {mode.entryFee.coins} 🪙
                </span>
                <span className="text-green-400 text-sm font-medium">
                  +{mode.reward.win}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Jogadores</h2>
        <div className="bg-slate-800/50 rounded-xl overflow-hidden">
          {MOCK_LEADERBOARD.global.slice(0, 5).map((player, i) => (
            <div
              key={player.rank}
              className="flex items-center gap-4 p-4 hover:bg-slate-800 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <span className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${player.rank === 1 ? 'bg-amber-400 text-amber-900' : ''}
                ${player.rank === 2 ? 'bg-slate-300 text-slate-900' : ''}
                ${player.rank === 3 ? 'bg-amber-600 text-amber-100' : ''}
                ${player.rank > 3 ? 'bg-slate-700 text-slate-400' : ''}
              `}>
                {player.rank}
              </span>
              <span className="text-2xl">{getCountryFlag(player.country)}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{player.username}</p>
                <p className="text-xs text-slate-400">Nv. {player.level}</p>
              </div>
              <span className="text-amber-400 font-bold">
                {formatNumber(player.coins)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
