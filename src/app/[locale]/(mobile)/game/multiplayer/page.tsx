'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks';
import { MultiplayerGameScreen } from '@/components/mobile';

function MultiplayerGamePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();

  const roomId = searchParams.get('room');

  useEffect(() => {
    if (!roomId) {
      router.replace(`/${locale}`);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, router, locale]);

  if (!roomId) {
    return null;
  }

  return <MultiplayerGameScreen roomId={roomId} />;
}

export default function MultiplayerGamePage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">A carregar...</span>
        </div>
      }
    >
      <MultiplayerGamePageInner />
    </Suspense>
  );
}
