'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import { GuestAccountManager } from '@/lib/auth/guestAccount';

function getRedirectLocale(): string {
  if (typeof window === 'undefined') return 'pt';
  return window.localStorage.getItem('bool_auth_redirect_locale') ?? 'pt';
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { migrateGuestToAuth, loadSession } = useUserStore();
  const [message, setMessage] = useState('Vinculando sua conta...');

  useEffect(() => {
    const finishAuth = async () => {
      const locale = getRedirectLocale();
      const code = searchParams.get('code');

      if (code) {
        setMessage('Confirmando login seguro...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage('Nao foi possivel concluir o login.');
          router.replace(`/${locale}/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user.id && GuestAccountManager.exists()) {
        setMessage('Salvando seu progresso...');
        await GuestAccountManager.migrateToAuth(session.user.id, supabase);
      }

      await loadSession();
      await migrateGuestToAuth();

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('bool_auth_redirect_locale');
      }

      router.replace(`/${locale}`);
    };

    void finishAuth();
  }, [loadSession, migrateGuestToAuth, router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-emerald-300" />
      <h1 className="text-xl font-bold">Bool Sinuca Premiere</h1>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
