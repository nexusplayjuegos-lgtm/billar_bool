'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Ball } from '@/types';

interface PocketedBallRackProps {
  balls: Ball[];
  pocketedBallIds: number[];
  variant?: 'flow' | 'overlay';
}

function PocketBall({ ball, index }: { ball: Ball; index: number }) {
  const isEight = ball.number === 8;
  const isStriped = Boolean(ball.isStriped);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10, scale: 0.45, rotate: -20 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26, delay: Math.min(index * 0.025, 0.16) }}
      className="relative grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-white/35 shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:h-5 md:w-5"
      style={{
        background: isStriped
          ? `linear-gradient(180deg, #f8fafc 0 28%, ${ball.color} 28% 72%, #f8fafc 72% 100%)`
          : isEight
            ? '#111827'
            : ball.color,
      }}
    >
      <span className="grid h-[9px] min-w-[9px] place-items-center rounded-full bg-white px-0.5 text-[4px] font-black leading-none text-slate-950 shadow-sm md:h-[11px] md:min-w-[11px] md:text-[5.5px]">
        {ball.number}
      </span>
      <span className="pointer-events-none absolute left-[3px] top-[3px] h-[4px] w-[4px] rounded-full bg-white/55 blur-[0.5px] md:left-1 md:top-1 md:h-1.5 md:w-1.5" />
    </motion.div>
  );
}

export function PocketedBallRack({ balls, pocketedBallIds, variant = 'flow' }: PocketedBallRackProps) {
  const orderedBalls = pocketedBallIds
    .filter((id) => id !== 0)
    .map((id) => balls.find((ball) => ball.id === id && ball.number !== 0))
    .filter((ball): ball is Ball => Boolean(ball));

  if (orderedBalls.length === 0) return null;

  return (
    <div
      className={
        variant === 'overlay'
          ? 'pointer-events-none mx-auto flex w-fit max-w-full items-center justify-center rounded-full border border-cyan-100/10 bg-slate-950/45 px-2 py-0.5 shadow-lg shadow-black/20 backdrop-blur-sm'
          : 'pointer-events-none w-full flex items-center justify-center px-3 py-1.5 bg-slate-950/70 backdrop-blur-sm border-b border-cyan-100/15 shadow-[inset_0_-2px_8px_rgba(0,0,0,0.35),0_1px_0_rgba(125,211,252,0.08)]'
      }
    >
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <AnimatePresence initial={false}>
          {orderedBalls.map((ball, index) => (
            <PocketBall key={ball.id} ball={ball} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
