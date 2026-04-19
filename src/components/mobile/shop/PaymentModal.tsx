'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, QrCode, Check, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: {
    type: 'coins' | 'cash' | 'special';
    amount: number;
    bonus?: number;
    price: number;
    label: string;
  } | null;
}

type PaymentMethod = 'credit' | 'pix' | 'googlepay';
type PaymentStep = 'method' | 'processing' | 'success';

export function PaymentModal({ isOpen, onClose, pack }: PaymentModalProps) {
  const { addCoins } = useUserStore() as any;
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [step, setStep] = useState<PaymentStep>('method');

  if (!isOpen || !pack) return null;

  const handlePay = () => {
    setStep('processing');
    // Simula processamento
    setTimeout(() => {
      if (pack.type === 'coins') {
        addCoins(pack.amount + (pack.bonus || 0));
      }
      setStep('success');
    }, 2000);
  };

  const handleClose = () => {
    setStep('method');
    setMethod('pix');
    onClose();
  };

  const methods: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
    { id: 'pix', label: 'PIX', icon: QrCode, color: 'bg-emerald-500' },
    { id: 'credit', label: 'Cartão', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'googlepay', label: 'Google Pay', icon: Smartphone, color: 'bg-slate-700' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
        onClick={step !== 'processing' ? handleClose : undefined}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-700"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 border-b border-slate-800 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-white">
              {step === 'success' ? 'Pagamento Confirmado!' : 'Finalizar Compra'}
            </h2>
            {step !== 'processing' && (
              <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Resumo do pacote */}
            {step !== 'success' && (
              <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center text-2xl',
                  pack.type === 'coins' ? 'bg-amber-500/20' :
                  pack.type === 'cash' ? 'bg-emerald-500/20' :
                  'bg-purple-500/20'
                )}>
                  {pack.type === 'coins' ? '🪙' : pack.type === 'cash' ? '💎' : '🎁'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{pack.label}</p>
                  {pack.bonus ? (
                    <p className="text-green-400 text-sm">+{pack.bonus.toLocaleString()} bônus</p>
                  ) : (
                    <p className="text-slate-400 text-sm">Pacote único</p>
                  )}
                </div>
                <p className="text-white font-bold text-lg">R$ {pack.price.toFixed(2)}</p>
              </div>
            )}

            {/* Etapa: Escolher método */}
            {step === 'method' && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">Forma de pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {methods.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                            method === m.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', m.color)}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={cn('text-xs font-medium', method === m.id ? 'text-blue-400' : 'text-slate-400')}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detalhes do método */}
                <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
                  {method === 'pix' && (
                    <div className="text-center">
                      <div className="w-40 h-40 mx-auto bg-white rounded-xl p-2 mb-3">
                        {/* QR Code simulado */}
                        <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-white" />
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">Escaneie com seu app bancário</p>
                    </div>
                  )}

                  {method === 'credit' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Número do cartão"
                        className="w-full px-4 py-3 bg-slate-800 rounded-lg text-white placeholder-slate-500 border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="flex-1 px-4 py-3 bg-slate-800 rounded-lg text-white placeholder-slate-500 border border-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          className="w-24 px-4 py-3 bg-slate-800 rounded-lg text-white placeholder-slate-500 border border-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {method === 'googlepay' && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <Smartphone className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm">Toque para pagar com Google Pay</p>
                    </div>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePay}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-green-500/20"
                >
                  Pagar R$ {pack.price.toFixed(2)}
                </motion.button>
              </>
            )}

            {/* Etapa: Processando */}
            {step === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <p className="text-white font-medium">Processando pagamento...</p>
                <p className="text-slate-400 text-sm">Não feche esta tela</p>
              </div>
            )}

            {/* Etapa: Sucesso */}
            {step === 'success' && (
              <div className="py-8 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <p className="text-white font-bold text-xl">Pagamento Aprovado!</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {pack.amount.toLocaleString()} {pack.type === 'coins' ? 'moedas' : pack.type === 'cash' ? 'cash' : 'itens'} adicionados
                  </p>
                  {pack.bonus ? (
                    <p className="text-green-400 text-sm">+{pack.bonus.toLocaleString()} bônus</p>
                  ) : null}
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl"
                >
                  Continuar
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
