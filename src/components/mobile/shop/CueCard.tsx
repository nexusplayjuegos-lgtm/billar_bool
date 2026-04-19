'use client';

import { motion } from 'framer-motion';
import { Check, Eye, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Cue } from '@/types';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

interface CueCardProps {
  cue: Cue;
  index: number;
  onPreview: (cue: Cue) => void;
}

const rarityColors = {
  common: 'from-slate-400 to-slate-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-300 via-amber-400 to-amber-500',
};

const rarityBorders = {
  common: 'border-slate-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-400/50',
};

export function CueCard({ cue, index, onPreview }: CueCardProps) {
  const t = useTranslations();
  const { profile, buyCue, equipCue } = useUserStore() as any;

  const isOwned = profile.equipment.ownedCues.includes(cue.id);
  const isEquipped = profile.equipment.currentCue === cue.id;
  const canAfford = profile.currencies.coins >= cue.price.coins && 
                    profile.currencies.cash >= cue.price.cash;
  const isLocked = Boolean(cue.levelRequired && profile.level < cue.levelRequired);

  const handleBuy = () => {
    if (!isOwned && canAfford && !isLocked) {
      buyCue(cue.id, cue.price.coins);
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
      className={cn(
        'relative bg-slate-900 rounded-xl overflow-hidden border-2',
        rarityBorders[cue.rarity]
      )}
    >
      {/* Rarity Glow */}
      <div 
        className={cn(
          'absolute inset-0 opacity-20 bg-gradient-to-br',
          rarityColors[cue.rarity]
        )}
      />

      {/* Legendary Animation */}
      {cue.rarity === 'legendary' && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
        />
      )}

      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              cue.rarity === 'common' && 'bg-slate-700 text-slate-300',
              cue.rarity === 'rare' && 'bg-blue-500/20 text-blue-400',
              cue.rarity === 'epic' && 'bg-purple-500/20 text-purple-400',
              cue.rarity === 'legendary' && 'bg-amber-500/20 text-amber-400'
            )}>
              {cue.rarity}
            </span>
            <h3 className="text-white font-bold mt-1">
              {t(cue.nameKey)}
            </h3>
          </div>
          <button
            onClick={() => onPreview(cue)}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Cue Visual */}
        <div className="h-32 flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative"
          >
            {/* Cue Representation */}
            <div 
              className={cn(
                'w-48 h-4 rounded-full bg-gradient-to-r',
                rarityColors[cue.rarity]
              )}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-6 rounded-full bg-amber-700 border-2 border-amber-500" />

            {/* Glow Effect */}
            {cue.effects.includes('idle_glow') && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                  'absolute inset-0 blur-xl bg-gradient-to-r',
                  rarityColors[cue.rarity]
                )}
              />
            )}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5 mb-4">
          {[
            { label: 'Potência', value: cue.stats.power },
            { label: 'Mira', value: cue.stats.aim },
            { label: 'Efeito', value: cue.stats.spin },
            { label: 'Tempo', value: cue.stats.time },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-14">{stat.label}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.value / 10) * 100}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className={cn(
                    'h-full rounded-full',
                    cue.rarity === 'common' && 'bg-slate-500',
                    cue.rarity === 'rare' && 'bg-blue-500',
                    cue.rarity === 'epic' && 'bg-purple-500',
                    cue.rarity === 'legendary' && 'bg-amber-400'
                  )}
                />
              </div>
              <span className="text-xs text-white w-4">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          {isOwned ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                {t('shop.owned')}
              </span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Nv. {cue.levelRequired}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {cue.price.coins > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-amber-400" />
                  <span className={cn(
                    'font-bold',
                    canAfford ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {formatCurrency(cue.price.coins)}
                  </span>
                </div>
              )}
              {cue.price.cash > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-400" />
                  <span className={cn(
                    'font-bold',
                    canAfford ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {cue.price.cash}
                  </span>
                </div>
              )}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isOwned ? handleEquip : handleBuy}
            disabled={(!isOwned && !canAfford) || isLocked}
            className={cn(
              'px-4 py-2 rounded-lg font-bold text-sm transition-all',
              isEquipped
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : isOwned
                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                : canAfford && !isLocked
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            {isEquipped ? 'EQUIPADO' : isOwned ? t('shop.equip') : t('shop.buy')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
