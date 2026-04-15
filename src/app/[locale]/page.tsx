'use client';

import { useDeviceDetection } from '@/hooks';
import { MobileLobbyScreen, MobileScaffold } from '@/components/mobile';
import { DesktopLobbyScreen, DesktopLayout } from '@/components/desktop';

export default function LobbyPage() {
  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return (
      <MobileScaffold>
        <MobileLobbyScreen />
      </MobileScaffold>
    );
  }

  return (
    <DesktopLayout>
      <DesktopLobbyScreen />
    </DesktopLayout>
  );
}
