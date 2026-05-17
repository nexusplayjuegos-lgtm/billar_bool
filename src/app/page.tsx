import Link from 'next/link';
import { Award, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

const features = [
  {
    title: 'Jogue gratis',
    description: 'Entre como convidado com um toque e comece a jogar 8-ball sem cadastro obrigatorio.',
    icon: Sparkles,
  },
  {
    title: 'Conquistas',
    description: 'Complete desafios permanentes, suba ranks e colete recompensas a cada vitoria.',
    icon: Award,
  },
  {
    title: 'Torneios em breve',
    description: 'A base competitiva ja esta preparada para salas, ranking e eventos sazonais.',
    icon: Trophy,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <section className="relative flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_75%_65%,rgba(59,130,246,0.16),transparent_35%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase text-emerald-200">
              Beta launch
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Bool Sinuca Premiere
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Jogue sinuca 8-ball online gratis com visual premium, bot competitivo, conquistas, caixas de vitoria e Pool Pass.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/pt/lobby"
                className="min-h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30"
              >
                Jogar Agora
              </Link>
              <Link
                href="/pt/login"
                className="min-h-12 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3 text-sm font-bold text-slate-200"
              >
                Vincular conta
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-3 shadow-2xl shadow-black/40">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950 p-3">
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="rounded-full bg-blue-500 px-3 py-1 text-white">EU</span>
                <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-amber-200">10s</span>
                <span className="rounded-full bg-slate-800 px-3 py-1">BOT</span>
              </div>
              <div className="relative aspect-[2/1] overflow-hidden rounded-xl border-[10px] border-[#5a392d] bg-[radial-gradient(circle_at_45%_45%,#1f8f3a,#145d2e_68%,#5b3a32_100%)] shadow-inner">
                <div className="absolute left-[24%] top-0 h-full border-l border-dashed border-white/20" />
                <div className="absolute left-[28%] top-[52%] h-4 w-4 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.75)]" />
                <div className="absolute right-[13%] top-[42%] grid grid-cols-5 gap-1">
                  {Array.from({ length: 15 }, (_, index) => (
                    <span
                      key={index}
                      className="h-4 w-4 rounded-full border border-white/40"
                      style={{ backgroundColor: ['#f8c02e', '#2563eb', '#ef4444', '#7c3aed', '#f97316'][index % 5] }}
                    />
                  ))}
                </div>
                <div className="absolute inset-x-0 top-4 mx-auto w-max rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-1 text-xs font-black text-amber-200">
                  APERTURA
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-black text-emerald-300">0%</span>
                <div className="h-5 flex-1 rounded-lg border border-slate-700 bg-slate-900">
                  <div className="h-full w-1/3 rounded-lg bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60 px-5 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <Icon className="mb-4 h-7 w-7 text-emerald-300" />
                <h2 className="text-lg font-black">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="px-5 py-6 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-5">
          <Link href="/privacy" className="hover:text-slate-300">Privacidade</Link>
          <Link href="/terms" className="hover:text-slate-300">Termos</Link>
        </div>
        <p className="mt-3">Bool Sinuca Premiere</p>
      </footer>
    </main>
  );
}
