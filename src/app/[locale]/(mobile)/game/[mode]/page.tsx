'use client';

import { useEffect } from 'react';
import { MobileGameScreen } from '@/components/mobile';
import { useGameStore } from '@/lib/store';
import { MOCK_GAME_MODES } from '@/mocks/data';

export default function GamePage({ params }: { params: { mode: string } }) {
  const { startGame } = useGameStore();

  useEffect(() => {
    const modeData = MOCK_GAME_MODES.find((m) => m.id === params.mode);
    if (modeData) {
      startGame(modeData.id, modeData.entryFee.coins, modeData.reward.win);
    }
  }, [params.mode, startGame]);

  return <MobileGameScreen />;
}
