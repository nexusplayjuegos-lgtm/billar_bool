import { redirect } from 'next/navigation';

interface Props {
  params: { locale: string };
  searchParams: { room?: string };
}

export const metadata = {
  title: 'Convite para jogar sinuca online - Bool Sinuca Premiere',
  description: 'Entra na sala e joga uma partida de sinuca 8-ball online com um amigo.',
  openGraph: {
    title: 'Convite para jogar sinuca online',
    description: 'Toca para entrar na sala e jogar 8-ball online com um amigo.',
    images: ['/og-image.jpg'],
  },
};

export default function GameIndexPage({ params, searchParams }: Props) {
  if (searchParams.room) {
    redirect(`/${params.locale}/join?room=${encodeURIComponent(searchParams.room)}`);
  }

  redirect(`/${params.locale}/game/mode_8ball_london`);
}
