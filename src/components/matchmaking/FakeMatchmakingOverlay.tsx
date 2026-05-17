'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Wifi } from 'lucide-react';
import { generateFakeOpponent, MATCHMAKING_STEPS } from '@/lib/matchmaking/fakeOpponent';
import type { FakeOpponent } from '@/lib/store/gameStore';
import { cn } from '@/lib/utils';

interface FakeMatchmakingOverlayProps {
  playerLevel: number;
  onCancel: () => void;
  onMatched: (opponent: FakeOpponent) => void;
  durationMs?: number;
}

function playRouletteTick(ctx: AudioContext) {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(640 + Math.random() * 420, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.09);
}

export function FakeMatchmakingOverlay({
  playerLevel,
  onCancel,
  onMatched,
  durationMs = 4200,
}: FakeMatchmakingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const matchedRef = useRef(false);
  const highlightIndexRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const candidates = useMemo(
    () => Array.from({ length: 12 }, () => generateFakeOpponent(playerLevel)),
    [playerLevel]
  );

  useEffect(() => {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
      void audioContextRef.current.resume();
    }

    const spinTimer = window.setInterval(() => {
      setHighlightIndex((current) => {
        const next = (current + 1) % candidates.length;
        highlightIndexRef.current = next;
        return next;
      });
      const ctx = audioContextRef.current;
      if (ctx?.state === 'running') playRouletteTick(ctx);
    }, 140);

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, MATCHMAKING_STEPS.length - 1));
    }, Math.max(700, durationMs / MATCHMAKING_STEPS.length));

    const doneTimer = window.setTimeout(() => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      const opponent = candidates[(highlightIndexRef.current + 3) % candidates.length];
      onMatched(opponent);
    }, durationMs);

    return () => {
      window.clearInterval(spinTimer);
      window.clearInterval(stepTimer);
      window.clearTimeout(doneTimer);
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [candidates, durationMs, onMatched]);

  const activeCandidate = candidates[highlightIndex];

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 18 }}
        className="w-full max-w-lg rounded-2xl border border-cyan-300/25 bg-slate-900 p-5 text-white shadow-2xl shadow-cyan-950/30"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15">
              <Wifi className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Matchmaking</p>
              <h2 className="text-xl font-black">{MATCHMAKING_STEPS[stepIndex]}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>

        <div className="relative mb-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70 p-4">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 border-x border-cyan-300/30 bg-cyan-300/5" />
          <div className="flex gap-3">
            {candidates.slice(0, 9).map((candidate, index) => {
              const active = index === highlightIndex % 9;
              return (
                <motion.div
                  key={candidate.id}
                  animate={{ y: active ? -6 : 0, scale: active ? 1.06 : 0.94 }}
                  className="flex min-w-20 flex-col items-center gap-2"
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black text-white ring-2',
                      candidate.avatarGradient,
                      active ? 'ring-cyan-200 shadow-lg shadow-cyan-500/25' : 'ring-white/10'
                    )}
                  >
                    {candidate.initials}
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-bold text-slate-300">
                    {candidate.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black', activeCandidate.avatarGradient)}>
            {activeCandidate.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-black">{activeCandidate.name}</p>
              <span>{activeCandidate.flag}</span>
              {activeCandidate.emoji && <span className="text-sm">{activeCandidate.emoji}</span>}
            </div>
            <p className="text-xs text-slate-400">
              Nv. {activeCandidate.level} · Win rate {activeCandidate.winRate}% · {activeCandidate.wins} vitorias
            </p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Sala preparada para PvP real
          </span>
          <span>Fallback 10s</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
