'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { SettingsScreen } from '@/components/mobile/settings';

export default function ProfilePage() {
  const t = useTranslations();
  const { profile } = useUserStore();
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-6"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-3xl mb-3">
          {profile.username.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
        <p className="text-slate-400">{profile.rank}</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{profile.stats.wins}</p>
          <p className="text-xs text-slate-400">Vitórias</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{profile.stats.losses}</p>
          <p className="text-xs text-slate-400">Derrotas</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{profile.stats.winRate}%</p>
          <p className="text-xs text-slate-400">Win Rate</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{profile.stats.maxWinStreak}</p>
          <p className="text-xs text-slate-400">Sequência Máx</p>
        </div>
      </motion.div>

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <button className="w-full flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
          <User className="w-5 h-5 text-slate-400" />
          <span className="text-white">Editar Perfil</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span className="text-white">{t('navigation.settings')}</span>
        </button>
        <button className="w-full flex items-center gap-3 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors">
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Sair</span>
        </button>
      </motion.div>
    </div>
  );
}
