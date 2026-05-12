'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useShop } from '@/hooks/useShop';
import { CueCard } from './CueCard';
import { TableCard } from './TableCard';
import { CueCanvas } from './CueCanvas';
import { PaymentModal } from './PaymentModal';
import type { ShopItem } from '@/types';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/types/shop';
import { Zap } from 'lucide-react';

const tabs = [
  { id: 'cue', label: 'Tacos' },
  { id: 'table', label: 'Mesas' },
  { id: 'coin', label: 'Moedas' },
  { id: 'cash', label: 'Cash' },
  { id: 'special', label: 'Especial' },
];

export function MobileShopScreen() {
  const t = useTranslations();
  const { items, flashDeals, isLoading } = useShop();
  const [activeTab, setActiveTab] = useState('cue');
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [paymentPack, setPaymentPack] = useState<{
    type: 'coins' | 'cash' | 'special';
    amount: number;
    bonus?: number;
    price: number;
    label: string;
  } | null>(null);

  const filteredItems = items.filter((item) => item.category === activeTab);

  const getItemDeal = (itemId: string) => {
    return flashDeals.find((d) => d.itemId === itemId);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-4">
        <div className="mb-1 inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
          Coleção premium
        </div>
        <h1 className="text-2xl font-black text-white">{t('shop.title')}</h1>
        <p className="text-sm text-slate-400">Itens premium para dominar a mesa</p>
      </motion.div>

      {/* Flash Deals Banner */}
      {flashDeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4 mb-3"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              {flashDeals.length} oferta{flashDeals.length > 1 ? 's' : ''} relâmpago ativa{flashDeals.length > 1 ? 's' : ''}!
            </span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl overflow-x-auto border border-slate-700/60">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 min-w-[70px] py-2 px-3 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          {(activeTab === 'cue' || activeTab === 'table') && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-slate-500 text-sm">Nenhum item disponível nesta categoria.</p>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const deal = getItemDeal(item.id);
                  if (activeTab === 'cue') {
                    return (
                      <CueCard
                        key={item.id}
                        item={item}
                        index={index}
                        onPreview={setPreviewItem}
                        dealDiscount={deal?.discountPercent}
                      />
                    );
                  }
                  return (
                    <TableCard
                      key={item.id}
                      item={item}
                      index={index}
                      dealDiscount={deal?.discountPercent}
                    />
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'coin' && (
            <motion.div key="coins" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
              {[
                { amount: 1000, price: 4.99, bonus: 0, popular: false },
                { amount: 5000, price: 19.99, bonus: 500, popular: true },
                { amount: 15000, price: 49.99, bonus: 2500, popular: false },
                { amount: 50000, price: 99.99, bonus: 15000, popular: false },
              ].map((pack, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'relative bg-slate-900/90 rounded-xl p-4 border shadow-[0_14px_28px_rgba(2,6,23,0.24)]',
                    pack.popular ? 'border-amber-400/50' : 'border-slate-700'
                  )}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 left-4 px-2 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full">
                      {t('shop.popular')}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                        <span className="text-xl">🪙</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{pack.amount.toLocaleString()} moedas</p>
                        {pack.bonus > 0 && <p className="text-green-400 text-xs">+{pack.bonus.toLocaleString()} bônus</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentPack({ type: 'coins', amount: pack.amount, bonus: pack.bonus, price: pack.price, label: `${pack.amount.toLocaleString()} moedas` })}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg"
                    >
                      R$ {pack.price}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'cash' && (
            <motion.div key="cash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
              {[
                { amount: 100, price: 9.99 },
                { amount: 550, price: 49.99, bonus: 50 },
                { amount: 1200, price: 99.99, bonus: 200 },
              ].map((pack, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/90 rounded-xl p-4 border border-emerald-500/30 shadow-[0_14px_28px_rgba(2,6,23,0.24)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <span className="text-xl">💎</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{pack.amount} cash</p>
                        {pack.bonus && <p className="text-emerald-400 text-xs">+{pack.bonus} bônus</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentPack({ type: 'cash', amount: pack.amount, bonus: pack.bonus, price: pack.price, label: `${pack.amount} cash` })}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg"
                    >
                      R$ {pack.price}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'special' && (
            <motion.div key="special" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
              {items.filter((i) => i.category === 'special' || i.isLimited).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Nenhuma oferta especial no momento.</p>
                </div>
              ) : (
                items
                  .filter((i) => i.category === 'special' || i.isLimited)
                  .map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{t('shop.limited')}</span>
                          <h3 className="text-white font-bold">{item.name}</h3>
                        </div>
                        {item.priceCoins > 0 && (
                          <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            {t('shop.save', { percent: Math.round((1 - item.priceCoins / (item.priceCoins * 2)) * 100) })}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{item.description}</p>
                      <button
                        onClick={() => setPaymentPack({ type: 'special', amount: 1, price: item.priceCash || 9.99, label: item.name })}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg"
                      >
                        {formatPrice(item.priceCoins, item.priceCash)}
                      </button>
                    </motion.div>
                  ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewItem(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">{previewItem.name}</h3>
              <div className="mb-4 flex h-48 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/45 px-3">
                <CueCanvas cueId={previewItem.id} rarity={previewItem.rarity} width={300} height={78} />
              </div>
              <p className="text-slate-400 text-sm mb-4">{previewItem.description}</p>
              <button onClick={() => setPreviewItem(null)} className="w-full py-3 bg-slate-700 text-white rounded-lg font-medium">
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <PaymentModal isOpen={!!paymentPack} onClose={() => setPaymentPack(null)} pack={paymentPack} />
    </div>
  );
}
