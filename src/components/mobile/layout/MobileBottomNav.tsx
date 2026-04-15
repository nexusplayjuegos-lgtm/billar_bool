'use client';

import { motion } from 'framer-motion';
import { Gamepad2, ShoppingCart, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks';

const navItems = [
  { id: 'play', icon: Gamepad2, href: '/', label: 'Play' },
  { id: 'shop', icon: ShoppingCart, href: '/shop', label: 'Shop', badge: 3 },
  { id: 'friends', icon: Users, href: '/friends', label: 'Friends', badge: 5 },
  { id: 'leaderboard', icon: Trophy, href: '/leaderboard', label: 'Ranking' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();

  const isActive = (href: string) => {
    if (href === '/') return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-16 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 border-t border-slate-700/50 flex items-center justify-around px-2"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link key={item.id} href={`/${locale}${item.href}`} className="relative">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all',
                active
                  ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30'
                  : 'hover:bg-slate-800/50'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    active ? 'text-blue-400' : 'text-slate-400'
                  )}
                />
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {item.badge}
                  </motion.span>
                )}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400"
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium',
                  active ? 'text-blue-400' : 'text-slate-400'
                )}
              >
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </motion.nav>
  );
}
