'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ShoppingCart, Users, Trophy, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store/userStore'; // ← CORRIGIDO
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks';

const sidebarItems = [
  { id: 'play', icon: Gamepad2, href: '/', label: 'Play' },
  { id: 'shop', icon: ShoppingCart, href: '/shop', label: 'Shop' },
  { id: 'friends', icon: Users, href: '/friends', label: 'Friends' },
  { id: 'leaderboard', icon: Trophy, href: '/leaderboard', label: 'Ranking' },
  { id: 'profile', icon: Settings, href: '/profile', label: 'Profile' },
];

interface DesktopLayoutProps {
  children: ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const t = useTranslations();
  const { profile, signOut } = useUserStore(); // ← CORRIGIDO: usa profile e signOut
  const pathname = usePathname();
  const { locale } = useLocale();

  // Fallback para convidado (não logado)
  const username = profile?.username || 'Convidado';
  const level = profile?.level || 1;
  const coins = profile?.currencies?.coins || 5000;
  const cash = profile?.currencies?.cash || 0;

  const isActive = (href: string) => {
    if (href === '/') return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  // Em rotas de jogo, renderizar tela cheia sem sidebar/padding
  const isGameRoute = pathname?.includes('/play/');

  if (isGameRoute) {
    return (
      <div className="h-screen w-full overflow-hidden bg-slate-950">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            BOOL SINUCA
          </h1>
          <p className="text-xs text-slate-500 mt-1">PREMIERE EDITION</p>
        </div>

        {/* User Card - CORRIGIDO */}
        <div className="p-4 m-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold truncate">{username}</p>
              <p className="text-xs text-slate-400">{t('lobby.level', { level })}</p>
            </div>
            {/* Botão Logout (só aparece se logado) */}
            {profile && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-900 rounded-lg p-2 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-400" />
              <span className="text-amber-400 text-sm font-bold">
                {formatNumber(coins)}
              </span>
            </div>
            <div className="flex-1 bg-slate-900 rounded-lg p-2 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold">
                {cash}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.id} href={`/${locale}${item.href}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    active
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(`navigation.${item.id}`)}</span>
                  {active && (
                    <motion.div
                      layoutId="desktopActive"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            BOOL Sinuca Premiere v1.0
          </p>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}