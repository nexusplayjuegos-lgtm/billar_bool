'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Coins } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { useShop } from '@/hooks/useShop';
import { trackEvent } from '@/lib/analytics/analytics';
import type { ShopItem } from '@/types';
import { cn } from '@/lib/utils';
import { getRarityColor, isItemOwned, isItemEquipped, formatPrice, calculateDiscountedPrice } from '@/types/shop';
import { TableCanvas } from './TableCanvas';

interface TableCardProps {
  item: ShopItem;
  index: number;
  dealDiscount?: number;
}

export function TableCard({ item, index, dealDiscount }: TableCardProps) {
  const { profile } = useUserStore();
  const { inventory, buyItem, equipItem } = useShop();

  const isOwned = isItemOwned(inventory, item.id);
  const isEquipped = isItemEquipped(inventory, item.id);
  const isLocked = false;

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

      {/* Visual */}
      <div className="h-32 mb-3 relative mt-6 flex items-center justify-center bg-slate-900/70 rounded-xl p-2 border border-white/5">
        <TableCanvas tableId={item.id} rarity={item.rarity} width={220} height={110} />

        {isEquipped && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            EQUIPADA
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

        {/* Price / Actions */}
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
          {isOwned ? (
            <span className="text-green-400 font-semibold flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" /> Adquirida
            </span>
          ) : (
            <span className={cn('font-bold flex items-center gap-1 text-sm', canAfford && !isLocked ? 'text-amber-400' : 'text-red-400')}>
              <Coins className="w-4 h-4" />
              {formatPrice(price.coins, price.cash)}
            </span>
          )}

          {!isOwned && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); void handleBuy(); }}
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold text-xs',
                canAfford && !isLocked ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
              disabled={!canAfford || isLocked}
            >
              {canAfford && !isLocked ? 'Comprar' : 'Bloqueado'}
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

          {isEquipped && <span className="text-green-400 text-xs font-semibold">Ativa</span>}
        </div>
      </div>
    </motion.div>
  );
}
