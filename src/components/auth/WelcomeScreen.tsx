'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Mail, Play } from 'lucide-react';
import { useLocale } from '@/hooks';
import { useUserStore } from '@/lib/store/userStore';

interface WelcomeScreenProps {
  redirectTo?: string;
}

export function WelcomeScreen({ redirectTo }: WelcomeScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { playAsGuest, signInWithOAuth } = useUserStore();
  const [loadingAction, setLoadingAction] = useState<'guest' | 'google' | null>(null);
  const [error, setError] = useState('');

  const getTarget = () => {
    if (redirectTo) return redirectTo;
    if (typeof window === 'undefined') return `/${locale}`;
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') ?? `/${locale}`;
  };

  const handleGuestPlay = async () => {
    setLoadingAction('guest');
    await playAsGuest();
    router.replace(getTarget());
  };

  const handleGoogleOAuth = async () => {
    setLoadingAction('google');
    setError('');
    try {
      await signInWithOAuth('google');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel iniciar login social');
      setLoadingAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#04785733,transparent_34%),radial-gradient(circle_at_bottom_right,#0ea5e933,transparent_32%)]" />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
              <span className="text-4xl">🎱</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">
              Bool
            </p>
            <h1 className="mt-2 text-4xl font-black leading-none">
              Sinuca Premiere
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Entre na mesa em um toque. Sua conta pode esperar.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleGuestPlay()}
              disabled={loadingAction !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-4 text-base font-black text-slate-950 shadow-[0_16px_42px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingAction === 'guest' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-slate-950" />
              )}
              JOGAR AGORA
            </button>
            <p className="text-center text-xs text-slate-400">
              Sem cadastro necessario
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wide text-slate-500">ou entre com</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleGoogleOAuth()}
              disabled={loadingAction !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingAction === 'google' ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-lg font-black">G</span>}
              Continuar com Google
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?redirect=${encodeURIComponent(getTarget())}`)}
            className="mx-auto flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-300"
          >
            <Mail className="h-4 w-4" />
            Usar email e senha
          </button>
        </motion.div>
      </section>
    </main>
  );
}
