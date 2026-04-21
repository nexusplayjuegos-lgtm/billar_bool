'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useLocale } from '@/hooks';
import { supabase } from '@/lib/supabase/client';
import { MultiplayerClient } from '@/lib/multiplayer/client';

interface Props {
  roomId: string;
}

export function JoinRoomClient({ roomId }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const { playAsGuest, session, isSessionLoaded } = useUserStore();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!roomId || hasJoined.current || !isSessionLoaded) return;

    let cancelled = false;

    const attemptJoin = async () => {
      try {
        const { data: { session: directSession } } = await supabase.auth.getSession();
        const activeSession = session || directSession;

        if (!activeSession?.user?.id) {
          if (!cancelled) setJoining(false);
          return;
        }

        if (!cancelled) {
          setJoining(true);
          setError(null);
        }

        const client = new MultiplayerClient(activeSession.user.id, {
          onRoomUpdate: () => {},
          onOpponentShot: () => {},
          onMessage: () => {},
          onOpponentJoined: () => {},
          onOpponentLeft: () => {},
        });

        await client.joinRoom(roomId);

        if (!cancelled) {
          hasJoined.current = true;
          router.replace(`/${locale}/game/multiplayer?room=${roomId}`);
        }
      } catch (err) {
        if (!cancelled) {
          hasJoined.current = false;
          setError(err instanceof Error ? err.message : 'Erro ao entrar na sala');
          setJoining(false);
        }
      }
    };

    void attemptJoin();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isSessionLoaded]);

  const handleGuestJoin = async () => {
    setJoining(true);
    setError(null);

    const userId = await playAsGuest();
    if (!userId) {
      setError('Não foi possível criar sessão. Tenta novamente.');
      setJoining(false);
      return;
    }

    try {
      const client = new MultiplayerClient(userId, {
        onRoomUpdate: () => {},
        onOpponentShot: () => {},
        onMessage: () => {},
        onOpponentJoined: () => {},
        onOpponentLeft: () => {},
      });
      await client.joinRoom(roomId);
      router.replace(`/${locale}/game/multiplayer?room=${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na sala.');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🎱</div>

        {joining ? (
          <>
            <p className="text-white text-lg font-semibold mb-4">A entrar na partida...</p>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          </>
        ) : (
          <>
            <h1 className="text-white text-xl font-bold mb-1">És convidado para uma partida!</h1>
            <p className="text-slate-400 text-sm mb-8">Modo 8-Ball — Entra agora</p>
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
          </>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
