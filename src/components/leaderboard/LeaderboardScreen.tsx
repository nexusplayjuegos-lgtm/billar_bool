'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Medal, User } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  weekly_wins: number;
  total_wins: number;
  total_coins_won: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const t = useTranslations();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order(period === 'weekly' ? 'weekly_wins' : 'total_wins', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      // Fallback para mock se offline
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          {t('leaderboard.title')}
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['weekly', 'monthly', 'allTime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t(`leaderboard.${p}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">{t('loading')}</div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 border border-slate-700/50"
              >
                <div className="w-8 flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-semibold">{entry.username}</h3>
                  <p className="text-slate-400 text-sm">
                    {period === 'weekly'
                      ? `${entry.weekly_wins} ${t('leaderboard.winsThisWeek')}`
                      : `${entry.total_wins} ${t('leaderboard.totalWins')}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-amber-400 font-bold">
                    {entry.total_coins_won.toLocaleString()} 🪙
                  </p>
                </div>
              </motion.div>
            ))}

            {entries.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                {t('leaderboard.noData')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}