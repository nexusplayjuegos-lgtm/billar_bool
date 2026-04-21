'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';

export function SessionProvider() {
  const { loadSession } = useUserStore();
  useEffect(() => { 
    console.log('[SessionProvider] Iniciando loadSession...');
    void loadSession().then(() => {
      console.log('[SessionProvider] loadSession concluído');
    });
  }, [loadSession]);
  return null;
}
