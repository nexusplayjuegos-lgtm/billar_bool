'use client';

import { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useUserStore } from '@/lib/store/userStore';
import { useViewportHeight } from '@/hooks';
import { WelcomeScreen } from './WelcomeScreen';
import { BindAccountPrompt } from './BindAccountPrompt';

type AuthState = 'loading' | 'welcome' | 'authenticated';

interface AuthContextValue {
  user: Session['user'] | null;
  isGuest: boolean;
  state: AuthState;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isGuest: false,
  state: 'loading',
});

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const { loadSession, isSessionLoaded, session, isGuest } = useUserStore();
  useViewportHeight();

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const isAuthRoute = pathname.includes('/login') || pathname.startsWith('/auth/callback');
  const hasAccess = Boolean(session || isGuest);
  const state: AuthState = !isSessionLoaded ? 'loading' : hasAccess ? 'authenticated' : 'welcome';

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, isGuest, state }}>
      {state === 'welcome' && !isAuthRoute ? <WelcomeScreen /> : children}
      {state === 'authenticated' && <BindAccountPrompt />}
    </AuthContext.Provider>
  );
}
