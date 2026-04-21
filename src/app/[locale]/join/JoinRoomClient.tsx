'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useLocale } from '@/hooks';

interface Props {
  roomId: string;
}

export function JoinRoomClient({ roomId }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const { session, playAsGuest } = useUserStore();
  const { joinRoom, error } = useMultiplayer();
  const [joining, setJoining] = useState(false);
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!session || !roomId || hasJoined.current) return;
    hasJoined.current = true;

    const autoJoin = async () => {
      setJoining(true);
      const room = await joinRoom(roomId);
      if (room) {
        router.replace(`/${locale}/play/multiplayer?room=${room.id}`);
      } else {
        setJoining(false);
      }
    };

    void autoJoin();
  }, [session, roomId, joinRoom, router, locale]);

  const handleGuestJoin = async () => {
    playAsGuest();
    setJoining(true);
    const room = await joinRoom(roomId);
    if (room) {
      router.replace(`/${locale}/play/multiplayer?room=${room.id}`);
    } else {
      setJoining(false);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎱</div>
          <p className="text-white text-lg font-semibold mb-4">A entrar na partida...</p>
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🎱</div>
        <h1 className="text-white text-xl font-bold mb-1">És convidado para uma partida!</h1>
        <p className="text-slate-400 text-sm mb-8">Modo 8-Ball — Entra agora</p>

        {joining ? (
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => void handleGuestJoin()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-base transition-colors"
            >
              Entrar como Convidado
            </button>
            <a
              href={`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/join?room=${roomId}`)}`}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Tenho conta — fazer login
            </a>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
