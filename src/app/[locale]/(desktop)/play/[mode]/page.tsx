'use client';

import { useEffect } from 'react';
import { DesktopGameScreen } from '@/components/desktop';
import { useGameStore } from '@/lib/store';
import { MOCK_GAME_MODES } from '@/mocks/data';

export default function DesktopGamePage({ params }: { params: { mode: string } }) {
  const { startGame } = useGameStore();

  useEffect(() => {
    const modeData = MOCK_GAME_MODES.find((m) => m.id === params.mode);
    if (modeData) {
      startGame(modeData.id, modeData.entryFee.coins, modeData.reward.win);
    }
  }, [params.mode, startGame]);

  return <DesktopGameScreen modeId={params.mode} />;
}
