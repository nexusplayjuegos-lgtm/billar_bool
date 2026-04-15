'use client';

import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MOCK_LEADERBOARD } from '@/mocks/data';

export default function FriendsPage() {
  const t = useTranslations();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Amigos
        </h1>
        <button className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {MOCK_LEADERBOARD.friends.map((friend, index) => (
          <motion.div
            key={friend.username}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {friend.username.slice(0, 2).toUpperCase()}
              </div>
              {friend.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-slate-800" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{friend.username}</p>
              <p className="text-xs text-slate-400">
                {friend.isOnline ? 'Online' : friend.lastSeen}
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
              Desafiar
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
