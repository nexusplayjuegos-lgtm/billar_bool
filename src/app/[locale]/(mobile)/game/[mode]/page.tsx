'use client';

import { useEffect } from 'react';
import { MobileGameScreen } from '@/components/mobile';
import { DesktopGameScreen } from '@/components/desktop';
import { useGameStore } from '@/lib/store';
import { MOCK_GAME_MODES } from '@/mocks/data';
import { useDeviceDetection } from '@/hooks';

export default function GamePage({ params }: { params: { mode: string } }) {
  const { startGame } = useGameStore();
  const { isMobile } = useDeviceDetection();

  useEffect(() => {
    const modeData = MOCK_GAME_MODES.find((m) => m.id === params.mode);
    if (modeData) {
      startGame(modeData.id, modeData.entryFee.coins, modeData.reward.win);
    }
  }, [params.mode, startGame]);

  // Renderiza o componente apropriado baseado no dispositivo
  if (isMobile) {
    return <MobileGameScreen />;
  }

  return <DesktopGameScreen modeId={params.mode} />;
}
