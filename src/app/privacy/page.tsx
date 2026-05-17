import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-200">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-emerald-300">Voltar</Link>
        <h1 className="mt-6 text-3xl font-black text-white">Privacidade</h1>
        <p className="mt-4 leading-relaxed text-slate-300">
          O Bool Sinuca Premiere usa dados essenciais para login, progresso, economia do jogo e melhoria da experiencia. Contas convidadas ficam no dispositivo ate serem vinculadas.
        </p>
        <p className="mt-4 leading-relaxed text-slate-300">
          Eventos anonimos de analytics podem ser usados para entender funil, partidas, compras virtuais e retencao. Nenhuma informacao sensivel e vendida.
        </p>
      </div>
    </main>
  );
}
