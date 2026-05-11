'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PassType } from '@/types';
import { PREMIUM_PRICE_EUR, ELITE_PRICE_EUR } from '@/types/poolPass';

interface PoolPassPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (type: PassType) => void;
  hasPremium: boolean;
  hasElite: boolean;
}

export function PoolPassPurchaseModal({ isOpen, onClose, onPurchase, hasPremium, hasElite }: PoolPassPurchaseModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white">Desbloquear Pass</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Premium Option */}
            <motion.button
              whileTap={!hasPremium ? { scale: 0.97 } : undefined}
              onClick={() => !hasPremium && onPurchase('premium')}
              disabled={hasPremium}
              className={cn(
                'w-full p-4 rounded-2xl border mb-3 text-left transition-all',
                hasPremium
                  ? 'border-green-500/50 bg-green-900/20 opacity-70'
                  : 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-900/20 hover:border-amber-400'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">Premium Pass</h3>
                    {hasPremium && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-2xl font-black text-amber-400 mt-1">€{PREMIUM_PRICE_EUR.toFixed(2)}</p>
                  <ul className="mt-2 space-y-1">
                    {['Todas as recompensas Premium', 'Retroage ranks alcançados', 'Acesso imediato'].map((f) => (
                      <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-amber-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.button>

            {/* Elite Option */}
            <motion.button
              whileTap={!hasElite ? { scale: 0.97 } : undefined}
              onClick={() => !hasElite && onPurchase('elite')}
              disabled={hasElite}
              className={cn(
                'w-full p-4 rounded-2xl border text-left transition-all',
                hasElite
                  ? 'border-green-500/50 bg-green-900/20 opacity-70'
                  : 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-purple-900/20 hover:border-purple-400'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">Elite Pass</h3>
                    {hasElite && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-2xl font-black text-purple-400 mt-1">€{ELITE_PRICE_EUR.toFixed(2)}</p>
                  <ul className="mt-2 space-y-1">
                    {['TUDO do Premium Pass', '+2000 Pool Points iniciais', '3x Pool Points em partidas', '3x velocidade nas Victory Boxes'].map((f) => (
                      <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-purple-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.button>

            <p className="text-center text-[10px] text-slate-500 mt-4">
              As compras são processadas de forma segura. Não há reembolso.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
