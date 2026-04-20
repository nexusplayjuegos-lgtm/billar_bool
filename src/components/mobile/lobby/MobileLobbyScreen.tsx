'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, TrendingUp, Users, Wifi, Plus, LogIn, X, Loader2, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GameModeCard } from './GameModeCard';
import { MOCK_GAME_MODES } from '@/mocks/data';
import { useUserStore, useGameStore } from '@/lib/store';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { GameMode, type GameMode as GameModeType } from '@/types';
import { cn, getCountryFlag } from '@/lib/utils';
import { useLocale } from '@/hooks';
import type { Room } from '@/lib/multiplayer/types';

type MultiplayerView = 'menu' | 'create' | 'join' | 'waiting';

export function MobileLobbyScreen() {
  const t = useTranslations();
  const { profile, removeCoins } = useUserStore();
  const { startGame } = useGameStore();
  const router = useRouter();
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Single player
  const [selectedMode, setSelectedMode] = useState<GameModeType | null>(null);

  // Multiplayer modal
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [mpView, setMpView] = useState<MultiplayerView>('menu');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const {
    createRoom,
    joinRoom,
    listRooms,
    room,
    isConnected,
    isMyTurn,
    error: mpError,
  } = useMultiplayer();

  // Quando oponente entra → ir para o jogo
  useEffect(() => {
    if (isConnected && room?.status === 'playing') {
      setShowMultiplayer(false);
      router.push(`/${locale}/play/multiplayer?room=${room.id}`);
    }
  }, [isConnected, room, locale, router]);

  // ── Single player ────────────────────────────────────────────
  const handleSelectMode = (mode: GameModeType) => {
    setSelectedMode(mode);
  };

  const handlePlay = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedMode) return;
    if (profile.currencies.coins < selectedMode.entryFee.coins) return;
    removeCoins(selectedMode.entryFee.coins);
    startGame(selectedMode.id, selectedMode.type, selectedMode.entryFee.coins, selectedMode.reward.win);
    router.push(`/${locale}/game/${selectedMode.id}`);
  };

  // ── Multiplayer ───────────────────────────────────────────────
  const handleOpenMultiplayer = () => {
    setMpView('menu');
    setShowMultiplayer(true);
  };

  const handleCreateRoom = async () => {
    setMpView('create');
    await createRoom('8ball', 0);
  };

  const handleOpenJoin = async () => {
    setMpView('join');
    setLoadingRooms(true);
    const rooms = await listRooms();
    setAvailableRooms(rooms);
    setLoadingRooms(false);
  };

  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    await joinRoom(joinCode.trim());
  };

  const handleCopyRoomId = () => {
    if (!room?.id) return;
    void navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseMultiplayer = () => {
    setShowMultiplayer(false);
    setMpView('menu');
    setJoinCode('');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 landscape:py-2"
      >
        <h1 className="text-xl landscape:text-base font-bold text-white mb-1 landscape:mb-0">
          {t('lobby.welcome', { username: profile.username })}
        </h1>
        <div className="flex items-center gap-4 text-sm landscape:text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {t('lobby.onlinePlayers', { count: '12.5K' })}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {profile.rank}
          </span>
        </div>
      </motion.div>

      {/* Game Modes Carousel */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 mb-2 landscape:mb-1">
          <h2 className="text-base landscape:text-sm font-semibold text-white">Escolha seu modo</h2>
          <p className="text-sm landscape:text-xs text-slate-400">Deslize para ver mais opções</p>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pinch-zoom',
          }}
        >
          {MOCK_GAME_MODES.map((mode, index) => (
            <div key={mode.id} className="snap-center shrink-0">
              <GameModeCard
                mode={mode}
                index={index}
                isSelected={selectedMode?.id === mode.id}
                onSelect={handleSelectMode}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Top Players Mini */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 py-2 landscape:py-1.5 bg-slate-900/50 border-t border-slate-800"
      >
        <div className="flex items-center justify-between mb-1.5 landscape:mb-1">
          <h3 className="text-sm landscape:text-xs font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 landscape:w-3 landscape:h-3 text-amber-400" />
            {t('lobby.topPlayers')}
          </h3>
          <button className="text-xs landscape:text-[10px] text-blue-400 hover:text-blue-300">
            Ver todos
          </button>
        </div>
        <div className="flex gap-2">
          {[
            { name: 'Efren R.', coins: '999M', country: 'PH' },
            { name: 'Ronnie O.', coins: '875M', country: 'GB' },
            { name: 'Sinucão', coins: '754M', country: 'BR' },
          ].map((player, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-800/50 rounded-lg p-2 landscape:p-1.5 flex items-center gap-2 landscape:gap-1"
            >
              <span className="text-lg landscape:text-base">{getCountryFlag(player.country)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs landscape:text-[10px] font-medium text-white truncate">{player.name}</p>
                <p className="text-[10px] landscape:text-[9px] text-amber-400">{player.coins}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FABs — Play + Multiplayer */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-3 z-20">
        {/* Multiplayer FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={handleOpenMultiplayer}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-slate-900"
        >
          <Wifi className="w-5 h-5 text-white" />
        </motion.button>

        {/* Single Player FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={handlePlay}
          className={cn(
            'w-14 h-14 landscape:w-12 landscape:h-12 rounded-full',
            'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
            'flex items-center justify-center shadow-lg shadow-amber-500/30',
            'border-4 border-slate-900'
          )}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Play className="w-7 h-7 text-slate-900 fill-slate-900" />
          </motion.div>
        </motion.button>
      </div>

      {/* ── Multiplayer Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
            onPointerDown={handleCloseMultiplayer}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" />

              {/* ── Menu principal ── */}
              {mpView === 'menu' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-blue-400" />
                      Multijogador Online
                    </h2>
                    <button onPointerDown={handleCloseMultiplayer}>
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onPointerDown={handleCreateRoom}
                      className="flex flex-col items-center gap-3 p-5 bg-blue-500/15 border border-blue-500/30 rounded-2xl active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">Criar Sala</p>
                        <p className="text-xs text-slate-400 mt-0.5">Convida um amigo</p>
                      </div>
                    </button>

                    <button
                      onPointerDown={handleOpenJoin}
                      className="flex flex-col items-center gap-3 p-5 bg-green-500/15 border border-green-500/30 rounded-2xl active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">Entrar</p>
                        <p className="text-xs text-slate-400 mt-0.5">Joga agora</p>
                      </div>
                    </button>
                  </div>

                  {mpError && (
                    <p className="mt-4 text-xs text-red-400 text-center">{mpError}</p>
                  )}
                </div>
              )}

              {/* ── Criar sala — aguardar oponente ── */}
              {mpView === 'create' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button onPointerDown={() => setMpView('menu')}>
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Aguardando oponente...</h2>
                  </div>

                  {!room ? (
                    <div className="flex flex-col items-center py-8 gap-4">
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                      <p className="text-sm text-slate-400">Criando sala...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-5">
                      {/* Animação de espera */}
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
                        <div className="absolute inset-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Users className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 text-center">
                        Partilha o código com o teu adversário
                      </p>

                      {/* Room ID copiável */}
                      <button
                        onPointerDown={handleCopyRoomId}
                        className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 w-full justify-between active:scale-95 transition-transform"
                      >
                        <span className="text-xs text-slate-300 font-mono truncate">{room.id}</span>
                        {copied
                          ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                          : <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                        }
                      </button>

                      <p className="text-xs text-slate-500">
                        A sala expira em 10 minutos
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Entrar em sala ── */}
              {mpView === 'join' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <button onPointerDown={() => setMpView('menu')}>
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Entrar numa sala</h2>
                  </div>

                  {/* Entrar por código */}
                  <div className="flex gap-2 mb-5">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Colar código da sala..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      onPointerDown={handleJoinByCode}
                      disabled={!joinCode.trim()}
                      className="px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold text-white disabled:opacity-40 active:scale-95 transition-transform"
                    >
                      Entrar
                    </button>
                  </div>

                  {/* Salas disponíveis */}
                  <p className="text-xs text-slate-400 mb-3">Salas abertas</p>

                  {loadingRooms ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  ) : availableRooms.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500">Nenhuma sala disponível</p>
                      <p className="text-xs text-slate-600 mt-1">Cria uma sala e convida um amigo!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {availableRooms.map((r) => (
                        <button
                          key={r.id}
                          onPointerDown={() => handleJoinRoom(r.id)}
                          className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:scale-95 transition-transform"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{r.game_mode.toUpperCase()}</p>
                            <p className="text-xs text-slate-400 font-mono">{r.id.slice(0, 8)}...</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.bet_coins > 0 && (
                              <span className="text-xs text-amber-400">{r.bet_coins} 🪙</span>
                            )}
                            <span className="text-xs text-green-400 font-semibold">Entrar →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}