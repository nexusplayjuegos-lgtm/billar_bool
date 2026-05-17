'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store';
import { useShop } from '@/hooks/useShop';
import { trackEvent } from '@/lib/analytics/analytics';
import type { ShopItem } from '@/types';
import { cn } from '@/lib/utils';
import { getRarityColor, isItemOwned, isItemEquipped, formatPrice, calculateDiscountedPrice } from '@/types/shop';
import { CueCanvas } from './CueCanvas';

interface CueCardProps {
  item: ShopItem;
  index: number;
  onPreview: (item: ShopItem) => void;
  dealDiscount?: number;
}

export function CueCard({ item, index, onPreview, dealDiscount }: CueCardProps) {
  const t = useTranslations();
  const { profile } = useUserStore();
  const { inventory, buyItem, equipItem } = useShop();

  const isOwned = isItemOwned(inventory, item.id);
  const isEquipped = isItemEquipped(inventory, item.id);
  const isLocked = Boolean(item.stats && item.stats.power && profile && profile.level < 1); // Simplificado

  const price = dealDiscount ? calculateDiscountedPrice(item, dealDiscount) : { coins: item.priceCoins, cash: item.priceCash };
  const canAffordCoins = (profile?.currencies?.coins || 0) >= price.coins;
  const canAffordCash = (profile?.currencies?.cash || 0) >= price.cash;
  const canAfford = price.coins > 0 ? canAffordCoins : canAffordCash;

  const handleBuy = async () => {
    if (!isOwned && canAfford && !isLocked) {
      const result = await buyItem(item.id);
      if (result.success) {
        trackEvent('shop_purchase', {
          item_id: item.id,
          category: item.category,
          rarity: item.rarity,
          coins: price.coins,
          cash: price.cash,
        });
      }
    }
  };

  const handleEquip = async () => {
    if (isOwned) {
      await equipItem(item.id);
    }
  };

  const rarityStyle = getRarityColor(item.rarity);
  const stats = item.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      className={cn(
        'relative bg-slate-800/90 rounded-2xl p-4 border cursor-pointer transition-all shadow-[0_16px_36px_rgba(2,6,23,0.28)]',
        isEquipped ? 'border-emerald-400 ring-2 ring-emerald-400/25' : 'border-slate-700/80',
        isLocked ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:border-slate-500'
      )}
    >
      {/* Badge de raridade */}
      <div className={cn('absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10 border', rarityStyle)}>
        {item.rarity}
      </div>

      {/* Preview button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview(item);
        }}
        className="absolute top-3 right-3 p-2 bg-slate-700/50 rounded-full hover:bg-slate-600 transition-colors z-10"
      >
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Visual */}
      <div className="h-28 mb-3 relative mt-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent" />
        <CueCanvas cueId={item.id} rarity={item.rarity} width={260} height={52} />

        {isEquipped && (
          <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            EQUIPADO
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div>
          <h3 className="text-white font-bold text-sm">{item.name}</h3>
          {item.description && (
            <p className="text-slate-400 text-xs line-clamp-1">{item.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          {stats.power !== undefined && <StatBar label={t('shop.power') || 'Potência'} value={stats.power} max={10} color="bg-red-500" />}
          {stats.aim !== undefined && <StatBar label={t('shop.aim') || 'Mira'} value={stats.aim} max={10} color="bg-blue-500" />}
          {stats.spin !== undefined && <StatBar label={t('shop.spin') || 'Efeito'} value={stats.spin} max={10} color="bg-purple-500" />}
          {stats.time !== undefined && <StatBar label={t('shop.time') || 'Tempo'} value={stats.time} max={10} color="bg-green-500" />}
        </div>

        {/* Price / Actions */}
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between gap-2">
          {isOwned ? (
            <span className="text-green-400 font-semibold flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" /> Adquirido
            </span>
          ) : (
            <span className={cn('font-bold flex items-center gap-1 text-sm', canAfford ? 'text-amber-400' : 'text-red-400')}>
              <Coins className="w-4 h-4" />
              {formatPrice(price.coins, price.cash)}
            </span>
          )}

          {!isOwned && !isLocked && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); void handleBuy(); }}
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold text-xs',
                canAfford ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
              disabled={!canAfford}
            >
              {canAfford ? 'Comprar' : 'Sem moedas'}
            </motion.button>
          )}

          {isOwned && !isEquipped && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); void handleEquip(); }}
              className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-500 hover:bg-blue-400 text-white"
            >
              Equipar
            </motion.button>
          )}

          {isEquipped && <span className="text-green-400 text-xs font-semibold">Ativo</span>}
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
        <div className={cn('h-full rounded-full', color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-white text-[10px] font-bold w-4 text-right">{value}</span>
    </div>
  );
}
