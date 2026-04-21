'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DesktopGameScreen } from '@/components/desktop';
import { useGameStore } from '@/lib/store';
import { useLocale } from '@/hooks';
import { MOCK_GAME_MODES } from '@/mocks/data';

export default function DesktopGamePage({ params }: { params: { mode: string } }) {
  const { startGame } = useGameStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  useEffect(() => {
    if (params.mode === 'multiplayer') {
      // Desktop multiplayer: redireciona para a versão mobile funcional
      const roomId = searchParams.get('room');
      if (roomId) {
        router.replace(`/${locale}/join?room=${roomId}`);
      } else {
        router.replace(`/${locale}`);
      }
      return;
    }

    const modeData = MOCK_GAME_MODES.find((m) => m.id === params.mode);
    if (modeData) {
      startGame(modeData.id, modeData.type, modeData.entryFee.coins, modeData.reward.win);
    }
  }, [params.mode, startGame, router, locale, searchParams]);

  if (params.mode === 'multiplayer') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DesktopGameScreen modeId={params.mode} />;
}
