'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, TrendingUp, Users, Star, Wifi, Plus, LogIn, X, Loader2, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOCK_GAME_MODES, MOCK_LEADERBOARD } from '@/mocks/data';
import { useUserStore, useGameStore } from '@/lib/store';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { formatNumber, getCountryFlag } from '@/lib/utils';
import { useLocale } from '@/hooks';
import type { Room } from '@/lib/multiplayer/types';

type MultiplayerView = 'menu' | 'create' | 'join';

export function DesktopLobbyScreen() {
  const t = useTranslations();
  const { profile, removeCoins, isGuest } = useUserStore();
  const { startGame } = useGameStore();
  const router = useRouter();
  const { locale } = useLocale();

  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [mpView, setMpView] = useState<MultiplayerView>('menu');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const { createRoom, joinRoom, listRooms, room, isConnected, error: mpError } = useMultiplayer();

  useEffect(() => {
    if (isConnected && room?.status === 'playing') {
      setShowMultiplayer(false);
      router.push(`/${locale}/game/multiplayer?room=${room.id}`);
    }
  }, [isConnected, room, locale, router]);

  const handleCreateRoom = async () => {
    setMpView('create');
    const result = await createRoom('8ball', 0);
    if (!result) setMpView('menu');
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
    const text = room.id;
    const tryClipboard = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const input = document.createElement('input');
        input.value = text;
        input.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, text.length);
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    void tryClipboard();
  };

  const handleCloseMultiplayer = () => {
    setShowMultiplayer(false);
    setMpView('menu');
    setJoinCode('');
  };

  return (
    <div className="space-y-8">
      {isGuest && (
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-slate-400">Cria conta para guardar o teu progresso</span>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Criar conta →
          </button>
        </div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white mb-2">
            Bem-vindo, {profile.username}!
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Escolha seu modo de jogo e domine a mesa
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const mode = MOCK_GAME_MODES[0];
                if (profile.currencies.coins >= mode.entryFee.coins) {
                  removeCoins(mode.entryFee.coins);
                  startGame(mode.id, mode.type, mode.entryFee.coins, mode.reward.win);
                  router.push(`/${locale}/play/${mode.id}`);
                }
              }}
              className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl flex items-center gap-2 hover:bg-white/90 transition-colors"
            >
              <Play className="w-5 h-5" />
              Jogar Agora
            </button>
            <button
              onClick={() => { setMpView('menu'); setShowMultiplayer(true); }}
              className="px-6 py-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              <Wifi className="w-5 h-5" />
              Multijogador
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Vitórias', value: profile.stats.wins, icon: Star, color: 'text-amber-400' },
          { label: 'Win Rate', value: `${profile.stats.winRate}%`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Moedas', value: formatNumber(profile.currencies.coins), icon: () => <div className="w-5 h-5 rounded-full bg-amber-400" />, color: 'text-amber-400' },
          { label: 'Amigos', value: profile.social.friends, icon: Users, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-slate-400 text-sm">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Game Modes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Modos de Jogo</h2>
        <div className="grid grid-cols-3 gap-4">
          {MOCK_GAME_MODES.slice(0, 3).map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (profile.currencies.coins >= mode.entryFee.coins) {
                  removeCoins(mode.entryFee.coins);
                  startGame(mode.id, mode.type, mode.entryFee.coins, mode.reward.win);
                  router.push(`/${locale}/play/${mode.id}`);
                }
              }}
              className="bg-slate-800/50 rounded-xl p-4 cursor-pointer hover:bg-slate-800 transition-colors"
              style={{ borderLeft: `4px solid ${mode.color}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">
                  {mode.type === '8ball' && '🎱'}
                  {mode.type === 'brazilian' && '🇧🇷'}
                  {mode.type === 'snooker' && '👑'}
                </span>
                <span className="text-xs text-slate-400">Nv. {mode.minLevel}+</span>
              </div>
              <h3 className="text-white font-bold mb-1">
                {t(`modes.${mode.id.split('_')[1]}.name`)}
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                {t(`modes.${mode.id.split('_')[1]}.subtitle`)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-sm font-medium">
                  {mode.entryFee.coins} 🪙
                </span>
                <span className="text-green-400 text-sm font-medium">
                  +{mode.reward.win}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Jogadores</h2>
        <div className="bg-slate-800/50 rounded-xl overflow-hidden">
          {MOCK_LEADERBOARD.global.slice(0, 5).map((player) => (
            <div
              key={player.rank}
              className="flex items-center gap-4 p-4 hover:bg-slate-800 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <span className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${player.rank === 1 ? 'bg-amber-400 text-amber-900' : ''}
                ${player.rank === 2 ? 'bg-slate-300 text-slate-900' : ''}
                ${player.rank === 3 ? 'bg-amber-600 text-amber-100' : ''}
                ${player.rank > 3 ? 'bg-slate-700 text-slate-400' : ''}
              `}>
                {player.rank}
              </span>
              <span className="text-2xl">{getCountryFlag(player.country)}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{player.username}</p>
                <p className="text-xs text-slate-400">Nv. {player.level}</p>
              </div>
              <span className="text-amber-400 font-bold">
                {formatNumber(player.coins)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Multiplayer Modal (centered dialog) ── */}
      <AnimatePresence>
        {showMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
            onClick={handleCloseMultiplayer}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Menu principal ── */}
              {mpView === 'menu' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-blue-400" />
                      Multijogador Online
                    </h2>
                    <button onClick={handleCloseMultiplayer} className="hover:text-white transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => isGuest ? router.push(`/${locale}/login`) : void handleCreateRoom()}
                      className={`flex flex-col items-center gap-3 p-5 bg-blue-500/15 border border-blue-500/30 rounded-2xl transition-colors ${isGuest ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/25'}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">Criar Sala</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isGuest ? 'Cria uma conta para jogar' : 'Convida um amigo'}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => void handleOpenJoin()}
                      className="flex flex-col items-center gap-3 p-5 bg-green-500/15 border border-green-500/30 rounded-2xl hover:bg-green-500/25 transition-colors"
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
                    <div className="mt-4 text-center">
                      <p className="text-xs text-red-400">{mpError}</p>
                      {isGuest && (
                        <button
                          onClick={() => router.push(`/${locale}/login`)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold mt-1 transition-colors"
                        >
                          Criar conta →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Criar sala — aguardar oponente ── */}
              {mpView === 'create' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setMpView('menu')} className="hover:text-white transition-colors">
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
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
                        <div className="absolute inset-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Users className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 text-center">
                        Partilha o código com o teu adversário
                      </p>
                      <button
                        onClick={handleCopyRoomId}
                        className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 w-full justify-between hover:bg-slate-700 transition-colors"
                      >
                        <span className="text-xs text-slate-300 font-mono truncate">{room.id}</span>
                        {copied
                          ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                          : <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                        }
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Joga sinuca comigo! ${window.location.origin}/${locale}/join?room=${room.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-600/20 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 hover:bg-green-600/30 transition-colors text-sm font-semibold"
                      >
                        💬 Convidar pelo WhatsApp
                      </a>
                      <p className="text-xs text-slate-500">A sala expira em 10 minutos</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Entrar em sala ── */}
              {mpView === 'join' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => setMpView('menu')} className="hover:text-white transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Entrar numa sala</h2>
                  </div>
                  <div className="flex gap-2 mb-5">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleJoinByCode(); }}
                      placeholder="Colar código da sala..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={() => void handleJoinByCode()}
                      disabled={!joinCode.trim()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                    >
                      Entrar
                    </button>
                  </div>
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
                          onClick={() => void handleJoinRoom(r.id)}
                          className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:bg-slate-700 transition-colors"
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
