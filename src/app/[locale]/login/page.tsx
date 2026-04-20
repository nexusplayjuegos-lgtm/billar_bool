'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store/userStore';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { signIn, signUp, playAsGuest } = useUserStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!username) throw new Error('Username required');
        await signUp(email, password, username);
      }
      router.push('/'); // Redireciona para lobby
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700"
      >
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          BOOL SINUCA
        </h1>
        <p className="text-slate-400 text-center mb-8">
          {isLogin ? t('loginTitle') : t('registerTitle')}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-slate-300 text-sm mb-1">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                placeholder="SinucaMaster"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : (isLogin ? t('loginButton') : t('registerButton'))}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
          >
            {isLogin ? t('noAccount') : t('hasAccount')}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <button
            onClick={() => { playAsGuest(); router.push('/'); }}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            {t('continueAsGuest')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}