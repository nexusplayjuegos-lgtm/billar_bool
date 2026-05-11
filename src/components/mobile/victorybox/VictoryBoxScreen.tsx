'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Plus, Zap, Crown } from 'lucide-react';
import { useLocale } from '@/hooks';
import { useVictoryBoxes } from '@/hooks/useVictoryBoxes';
import { usePoolPass } from '@/hooks/usePoolPass';
import { useUserStore } from '@/lib/store/userStore';
import { cn } from '@/lib/utils';
import { VictoryBoxCard } from './VictoryBoxCard';
import { VictoryBoxOpenModal } from './VictoryBoxOpenModal';
import type { BoxReward, BoxType } from '@/types';

export function VictoryBoxScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { profile } = useUserStore();
  const { progress: poolPassProgress } = usePoolPass();
  const hasElite = poolPassProgress?.hasElite ?? false;

  const {
    boxes,
    isLoading,
    refresh,
    startUnlock,
    openBox,
    accelerateBox,
    slotsUsed,
    maxSlots,
    slotsAvailable,
  } = useVictoryBoxes();

  const [openModal, setOpenModal] = useState<{
    isOpen: boolean;
    rewards: BoxReward[];
    boxType: BoxType;
  }>({ isOpen: false, rewards: [], boxType: 'common' });

  const handleStartUnlock = useCallback(
    async (boxId: string) => {
      await startUnlock(boxId);
    },
    [startUnlock]
  );

  const handleAccelerate = useCallback(
    async (boxId: string) => {
      await accelerateBox(boxId);
    },
    [accelerateBox]
  );

  const handleOpen = useCallback(
    async (boxId: string) => {
      const result = await openBox(boxId);
      if (result.success && result.rewards) {
        setOpenModal({
          isOpen: true,
          rewards: result.rewards,
          boxType: result.boxType || 'common',
        });
      }
    },
    [openBox]
  );

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-lg font-black text-white">Victory Boxes</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-white">
              {slotsUsed}/{maxSlots}
            </span>
            {hasElite && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300 uppercase">Elite</span>
              </span>
            )}
          </div>
        </div>

        {/* Slots indicator */}
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: maxSlots }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-2 rounded-full transition-colors',
                i < slotsUsed
                  ? hasElite && i >= 4
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  : hasElite && i >= 4
                    ? 'bg-slate-800 border border-amber-500/30'
                    : 'bg-slate-800'
              )}
            />
          ))}
        </div>

        {hasElite && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs text-amber-300 font-medium">
              Desbloqueio 3x mais rápido
            </p>
          </motion.div>
        )}

        {slotsAvailable === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2"
          >
            <p className="text-xs text-amber-300 text-center">
              Slots cheios! Abra ou acelere uma box para ganhar mais.
            </p>
          </motion.div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {boxes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <Package className="w-16 h-16 text-slate-700" />
            <div>
              <p className="text-slate-400 font-medium">Nenhuma Victory Box</p>
              <p className="text-xs text-slate-500 mt-1">
                Vença partidas para ganhar boxes com recompensas!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {boxes.map((box) => (
              <VictoryBoxCard
                key={box.id}
                box={box}
                hasElite={hasElite}
                onStartUnlock={handleStartUnlock}
                onAccelerate={handleAccelerate}
                onOpen={handleOpen}
              />
            ))}

            {/* Empty slots */}
            {slotsAvailable > 0 &&
              Array.from({ length: Math.min(slotsAvailable, 2) }).map((_, i) => {
                const slotIndex = slotsUsed + i;
                const isEliteSlot = hasElite && slotIndex >= 4;
                return (
                  <div
                    key={`empty-${i}`}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed min-h-[180px]',
                      isEliteSlot
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-slate-800 bg-slate-900/30'
                    )}
                  >
                    {isEliteSlot ? (
                      <Crown className="w-6 h-6 text-amber-500/60 mb-1" />
                    ) : (
                      <Plus className="w-8 h-8 text-slate-700 mb-2" />
                    )}
                    <p className={cn('text-xs', isEliteSlot ? 'text-amber-400/70' : 'text-slate-600')}>
                      {isEliteSlot ? 'Slot Elite' : 'Slot vazio'}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modals */}
      <VictoryBoxOpenModal
        isOpen={openModal.isOpen}
        onClose={() => {
          setOpenModal((prev) => ({ ...prev, isOpen: false }));
          void refresh();
        }}
        rewards={openModal.rewards}
        boxType={openModal.boxType}
      />
    </div>
  );
}
