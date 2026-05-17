'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Ball } from '@/types';

interface PocketedBallRackProps {
  balls: Ball[];
  pocketedBallIds: number[];
}

function PocketBall({ ball, index }: { ball: Ball; index: number }) {
  const isEight = ball.number === 8;
  const isStriped = Boolean(ball.isStriped);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.45, rotate: -28 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26, delay: Math.min(index * 0.025, 0.16) }}
      className="relative grid h-4 w-4 place-items-center rounded-full border border-white/35 shadow-[0_3px_8px_rgba(0,0,0,0.45)] md:h-5 md:w-5"
      style={{
        background: isStriped
          ? `linear-gradient(180deg, #f8fafc 0 28%, ${ball.color} 28% 72%, #f8fafc 72% 100%)`
          : isEight
            ? '#111827'
            : ball.color,
      }}
    >
      <span className="grid h-2 min-w-2 place-items-center rounded-full bg-white px-0.5 text-[5px] font-black leading-none text-slate-950 shadow-sm md:h-3 md:min-w-3 md:text-[7px]">
        {ball.number}
      </span>
      <span className="pointer-events-none absolute left-1 top-1 h-1 w-1 rounded-full bg-white/55 blur-[0.5px] md:h-1.5 md:w-1.5" />
    </motion.div>
  );
}

export function PocketedBallRack({ balls, pocketedBallIds }: PocketedBallRackProps) {
  const orderedBalls = pocketedBallIds
    .filter((id) => id !== 0)
    .map((id) => balls.find((ball) => ball.id === id && ball.number !== 0))
    .filter((ball): ball is Ball => Boolean(ball));

  return (
    <div className="pointer-events-none absolute bottom-3 top-3 z-20 flex items-center portrait:-right-8 landscape:-right-9 md:-right-11">
      <div className="relative flex h-full w-8 items-end justify-center overflow-hidden rounded-full border border-cyan-100/45 bg-cyan-50/10 px-1 py-2 shadow-[inset_4px_0_10px_rgba(255,255,255,0.22),inset_-5px_0_14px_rgba(8,47,73,0.45),0_10px_24px_rgba(0,0,0,0.38),0_0_18px_rgba(125,211,252,0.18)] backdrop-blur-md landscape:w-9 md:w-10 md:px-1.5 md:py-2.5">
        <div className="absolute inset-x-1.5 bottom-1.5 top-1.5 rounded-full border border-white/25 bg-gradient-to-b from-white/22 via-sky-200/10 to-slate-950/35 md:inset-x-2 md:bottom-2 md:top-2" />
        <div className="absolute left-1.5 top-7 h-20 w-1 rounded-full bg-white/45 blur-[1px] md:left-2 md:h-28" />
        <div className="absolute bottom-8 right-1.5 h-28 w-1 rounded-full bg-cyan-200/20 blur-[1px] md:right-2 md:h-40" />
        <div className="absolute bottom-5 left-1 top-5 w-0.5 rounded-full bg-white/25 md:left-1.5 md:w-1" />
        <div className="absolute bottom-5 right-1 top-5 w-0.5 rounded-full bg-slate-950/45 md:right-1.5 md:w-1" />
        <div className="relative flex flex-col-reverse items-center gap-px md:gap-0.5">
          <AnimatePresence initial={false}>
            {orderedBalls.map((ball, index) => (
              <PocketBall key={ball.id} ball={ball} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
