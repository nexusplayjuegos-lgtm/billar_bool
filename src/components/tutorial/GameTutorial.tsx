'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Hand, MousePointer2, PiggyBank, ShieldCheck, X } from 'lucide-react';
import { audioManager } from '@/lib/audio/audioManager';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bool_game_tutorial_completed';

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  selector?: string;
  placement: 'top' | 'middle' | 'bottom';
  icon: ComponentType<{ className?: string }>;
}

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const steps: TutorialStep[] = [
  {
    id: 'aim',
    title: 'Mire pela linha',
    body: 'Toque ou arraste em qualquer area da mesa para apontar a tacada. A linha mostra a direcao antes da forca.',
    selector: '.match-table-stage',
    placement: 'middle',
    icon: Crosshair,
  },
  {
    id: 'power',
    title: 'Puxe a forca',
    body: 'Toque na mesa ou no taco, arraste para ajustar direcao e distancia. Quanto maior o arrasto, maior a forca.',
    selector: '.match-table-stage',
    placement: 'middle',
    icon: Hand,
  },
  {
    id: 'release',
    title: 'Solte para bater',
    body: 'Quando estiver pronto, solte o gesto. O taco avanca rapido e a fisica assume a jogada.',
    selector: '.match-table-stage',
    placement: 'middle',
    icon: MousePointer2,
  },
  {
    id: 'rules',
    title: 'Regra da bola 8',
    body: 'Limpe todas as bolas do seu grupo antes da 8. Encaçapar a 8 cedo e derrota instantanea.',
    selector: '.match-table-stage',
    placement: 'middle',
    icon: ShieldCheck,
  },
  {
    id: 'economy',
    title: 'Progresso permanente',
    body: 'Vitorias rendem moedas, PP, caixas, missoes e conquistas. Vincule a conta para guardar tudo.',
    placement: 'top',
    icon: PiggyBank,
  },
];

function getFallbackRect(placement: TutorialStep['placement']): HighlightRect {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (placement === 'bottom') {
    return { left: width * 0.08, top: height * 0.76, width: width * 0.84, height: height * 0.16 };
  }
  if (placement === 'top') {
    return { left: width * 0.08, top: height * 0.08, width: width * 0.84, height: height * 0.18 };
  }
  return { left: width * 0.08, top: height * 0.24, width: width * 0.84, height: height * 0.45 };
}

export function GameTutorial() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const step = steps[index];
  const Icon = step.icon;

  const finish = useCallback(() => {
    audioManager.play('ui_click');
    window.localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }, []);

  const updateRect = useCallback(() => {
    if (!step) return;
    const element = step.selector ? document.querySelector(step.selector) : null;
    if (element instanceof HTMLElement) {
      const bounds = element.getBoundingClientRect();
      setRect({
        left: Math.max(8, bounds.left - 6),
        top: Math.max(8, bounds.top - 6),
        width: Math.min(window.innerWidth - 16, bounds.width + 12),
        height: Math.min(window.innerHeight - 16, bounds.height + 12),
      });
      return;
    }
    setRect(getFallbackRect(step.placement));
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== '1');
  }, []);

  useEffect(() => {
    if (!visible) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('orientationchange', updateRect);
    const timer = window.setInterval(updateRect, 500);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('orientationchange', updateRect);
      window.clearInterval(timer);
    };
  }, [visible, updateRect]);

  const cardClassName = useMemo(() => {
    if (step.placement === 'bottom') return 'bottom-[max(32px,calc(env(safe-area-inset-bottom)+14px))]';
    if (step.placement === 'top') return 'top-[max(18px,env(safe-area-inset-top))]';
    return 'top-1/2 -translate-y-1/2';
  }, [step.placement]);

  if (!visible || !rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/68 backdrop-blur-[1px]" />
        <motion.div
          className="pointer-events-none absolute rounded-[22px] border-2 border-emerald-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_34px_rgba(52,211,153,0.55)]"
          animate={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn(
            'absolute left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-emerald-300/30 bg-slate-950/95 p-4 text-white shadow-2xl shadow-emerald-950/40',
            cardClassName
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15">
                <Icon className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">
                  Tutorial {index + 1}/{steps.length}
                </p>
                <h2 className="text-lg font-black">{step.title}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
              aria-label="Pular tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">{step.body}</p>
          <div className="mb-4 grid grid-cols-5 gap-1">
            {steps.map((item, stepIndex) => (
              <div
                key={item.id}
                className={cn('h-1.5 rounded-full', stepIndex <= index ? 'bg-emerald-300' : 'bg-slate-700')}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={finish}
              className="min-h-11 rounded-xl bg-slate-800 px-4 text-sm font-bold text-slate-300"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={() => {
                audioManager.play('ui_click');
                if (index >= steps.length - 1) {
                  finish();
                } else {
                  setIndex((current) => current + 1);
                }
              }}
              className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-black text-white"
            >
              {index >= steps.length - 1 ? 'Jogar' : 'Proximo'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
