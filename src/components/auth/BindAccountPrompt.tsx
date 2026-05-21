'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useLocale } from '@/hooks';
import { useUserStore } from '@/lib/store/userStore';

const BIND_PROMPT_STORAGE_KEY = 'bool_bind_prompted';

export function BindAccountPrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();
  const { isGuest, profile, session } = useUserStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isGameRoute = pathname?.includes('/game/');
    if (session || !isGuest || isGameRoute || profile.stats.totalGames < 3) {
      setVisible(false);
      return;
    }

    const prompted = window.localStorage.getItem(BIND_PROMPT_STORAGE_KEY);
    setVisible(prompted !== '1');
  }, [isGuest, pathname, profile.stats.totalGames, session]);

  const dismiss = () => {
    window.localStorage.setItem(BIND_PROMPT_STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-xl border border-emerald-300/25 bg-slate-950/95 p-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Salve seu progresso!</p>
          <p className="text-xs text-slate-400">Vincule uma conta e mantenha moedas, tacos e vitórias.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/login?bind=1`)}
          className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"
        >
          Vincular Conta
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          aria-label="Depois"
        >
          Depois
        </button>
      </div>
    </div>
  );
}
