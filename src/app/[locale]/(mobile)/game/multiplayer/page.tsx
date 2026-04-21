'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks';
import { MultiplayerGameScreen } from '@/components/mobile';
import { useGameStore } from '@/lib/store';

// Força renderização dinâmica — esta página depende de searchParams (roomId)
export const dynamic = 'force-dynamic';

export default function MultiplayerGamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { startGame } = useGameStore();

  const roomId = searchParams.get('room');

  useEffect(() => {
    if (!roomId) {
      router.replace(`/${locale}`);
      return;
    }
    // Inicializa game store com modo multiplayer genérico
    startGame('multiplayer', '8ball', 0, 0);
  }, [roomId, router, locale, startGame]);

  if (!roomId) {
    return null;
  }

  return <MultiplayerGameScreen roomId={roomId} />;
}
