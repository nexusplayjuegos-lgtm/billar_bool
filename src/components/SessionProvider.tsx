'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';

export function SessionProvider() {
  const { loadSession } = useUserStore();
  useEffect(() => { void loadSession(); }, [loadSession]);
  return null;
}
