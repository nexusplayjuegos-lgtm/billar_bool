import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-200">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-emerald-300">Voltar</Link>
        <h1 className="mt-6 text-3xl font-black text-white">Termos</h1>
        <p className="mt-4 leading-relaxed text-slate-300">
          O Bool Sinuca Premiere esta em beta. Recursos, recompensas, economia, torneios e placares podem ser ajustados durante testes.
        </p>
        <p className="mt-4 leading-relaxed text-slate-300">
          Use o jogo de forma justa. Exploits, automacoes abusivas ou manipulacao de partidas podem levar a reset de progresso.
        </p>
      </div>
    </main>
  );
}
