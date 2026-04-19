'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store';
import { Cue } from '@/types';
import { cn } from '@/lib/utils';
import { CueCanvas } from './CueCanvas';

interface CueCardProps {
  cue: Cue;
  index: number;
  onPreview: (cue: Cue) => void;
}

export function CueCard({ cue, index, onPreview }: CueCardProps) {
  const t = useTranslations();
  const { profile, buyCue, equipCue } = useUserStore() as any;

  const priceCoins = cue.price.coins;
  const priceCash = cue.price.cash;
  const price = priceCoins > 0 ? priceCoins : priceCash;

  const isOwned = profile?.equipment?.ownedCues?.includes(cue.id) || false;
  const isEquipped = profile?.equipment?.currentCue === cue.id;
  const canAffordCoins = (profile?.currencies?.coins || 0) >= priceCoins;
  const canAffordCash = (profile?.currencies?.cash || 0) >= priceCash;
  const canAfford = priceCoins > 0 ? canAffordCoins : canAffordCash;
  const isLocked = Boolean(cue.levelRequired && profile?.level < cue.levelRequired);

  const handleBuy = () => {
    if (!isOwned && canAfford && !isLocked) {
      buyCue(cue.id, price);
    }
  };

  const handleEquip = () => {
    if (isOwned) {
      equipCue(cue.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      className={cn(
        'relative bg-slate-800 rounded-2xl p-4 border-2 cursor-pointer transition-all',
        isEquipped ? 'border-green-500 ring-2 ring-green-500/30' : 'border-slate-700',
        isLocked ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:border-slate-600'
      )}
    >
      {/* Badge de raridade */}
      <div className={cn(
        "absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10",
        cue.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
        cue.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
        cue.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
        'bg-slate-500/20 text-slate-400 border border-slate-500/50'
      )}>
        {cue.rarity}
      </div>

      {/* Ícone de olho para preview */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview(cue);
        }}
        className="absolute top-3 right-3 p-2 bg-slate-700/50 rounded-full hover:bg-slate-600 transition-colors z-10"
      >
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Visual do Taco - Canvas 2D Profissional */}
      <div className="h-28 mb-3 relative mt-6 flex items-center justify-center">
        <CueCanvas cueId={cue.id} width={260} height={52} />

        {/* Badge de equipado */}
        {isEquipped && (
          <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            EQUIPADO
          </div>
        )}

        {/* Badge de bloqueado */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div>
          <h3 className="text-white font-bold text-sm">{t(cue.nameKey)}</h3>
          {cue.levelRequired && (
            <p className="text-slate-400 text-xs">Nv. {cue.levelRequired}+</p>
          )}
        </div>

        {/* Stats com barras visuais */}
        <div className="space-y-1.5">
          <StatBar label={t('shop.power') || 'Potência'} value={cue.stats.power} max={10} color="bg-red-500" />
          <StatBar label={t('shop.aim') || 'Mira'} value={cue.stats.aim} max={10} color="bg-blue-500" />
          <StatBar label={t('shop.spin') || 'Efeito'} value={cue.stats.spin} max={10} color="bg-purple-500" />
          <StatBar label={t('shop.time') || 'Tempo'} value={cue.stats.time} max={10} color="bg-green-500" />
        </div>

        {/* Preço ou Status */}
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
          {isOwned ? (
            <span className="text-green-400 font-semibold flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" /> Adquirido
            </span>
          ) : (
            <span className={cn(
              "font-bold flex items-center gap-1 text-sm",
              canAfford ? 'text-amber-400' : 'text-red-400'
            )}>
              <Coins className="w-4 h-4" />
              {price.toLocaleString()}
            </span>
          )}

          {!isOwned && !isLocked && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleBuy();
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold text-xs",
                canAfford
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
              disabled={!canAfford}
            >
              {canAfford ? 'Comprar' : 'Sem moedas'}
            </motion.button>
          )}

          {isOwned && !isEquipped && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleEquip();
              }}
              className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-500 hover:bg-blue-400 text-white"
            >
              Equipar
            </motion.button>
          )}

          {isEquipped && (
            <span className="text-green-400 text-xs font-semibold">Ativo</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-[10px] w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-white text-[10px] font-bold w-4 text-right">{value}</span>
    </div>
  );
}
