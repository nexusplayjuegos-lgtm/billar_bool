'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MOCK_LEADERBOARD } from '@/mocks/data';
import { formatNumber, getCountryFlag } from '@/lib/utils';

export default function LeaderboardPage() {
  const t = useTranslations();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Ranking Global
        </h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {MOCK_LEADERBOARD.global.map((player, index) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3"
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${player.rank === 1 ? 'bg-amber-400 text-amber-900' : ''}
              ${player.rank === 2 ? 'bg-slate-300 text-slate-900' : ''}
              ${player.rank === 3 ? 'bg-amber-600 text-amber-100' : ''}
              ${player.rank > 3 ? 'bg-slate-700 text-slate-400' : ''}
            `}>
              {player.rank <= 3 ? <Medal className="w-4 h-4" /> : player.rank}
            </div>
            <span className="text-2xl">{getCountryFlag(player.country)}</span>
            <div className="flex-1">
              <p className="text-white font-medium">{player.username}</p>
              <p className="text-xs text-slate-400">Nv. {player.level}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-bold">
                {formatNumber(player.coins)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
