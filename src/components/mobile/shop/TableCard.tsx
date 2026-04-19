'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { TableCanvas } from './TableCanvas';
import { TABLE_DESIGNS } from '@/lib/shop/tableDesigns';

interface TableCardProps {
  tableId: string;
  index: number;
}

export function TableCard({ tableId, index }: TableCardProps) {
  const t = useTranslations();
  const { profile } = useUserStore() as any;

  const design = TABLE_DESIGNS.find(d => d.id === tableId);
  if (!design) return null;

  // Mock price baseado na raridade
  const price = design.rarity === 'common' ? 0 :
    design.rarity === 'rare' ? 5000 :
    design.rarity === 'epic' ? 15000 : 50000;

  const isOwned = profile?.equipment?.ownedTables?.includes(tableId) || false;
  const isEquipped = profile?.equipment?.currentTable === tableId;
  const canAfford = (profile?.currencies?.coins || 0) >= price;
  const isLocked = false; // Mesas não têm level requirement no mock

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
        design.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
        design.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
        design.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
        'bg-slate-500/20 text-slate-400 border border-slate-500/50'
      )}>
        {design.rarity}
      </div>

      {/* Visual da Mesa - Canvas 2D Profissional */}
      <div className="h-32 mb-3 relative mt-6 flex items-center justify-center bg-slate-900/50 rounded-xl p-2">
        <TableCanvas tableId={tableId} width={220} height={110} />

        {/* Badge de equipado */}
        {isEquipped && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            EQUIPADA
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
          <h3 className="text-white font-bold text-sm">{design.name}</h3>
        </div>

        {/* Preço ou Status */}
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
          {isOwned ? (
            <span className="text-green-400 font-semibold flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" /> Adquirida
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

          {isOwned && !isEquipped && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-500 hover:bg-blue-400 text-white"
            >
              Equipar
            </motion.button>
          )}

          {isEquipped && (
            <span className="text-green-400 text-xs font-semibold">Ativa</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
