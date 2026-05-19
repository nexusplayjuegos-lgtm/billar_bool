import { JoinRoomClient } from './JoinRoomClient';

interface Props {
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

export default function JoinPage({ searchParams }: Props) {
  const roomId = searchParams.room ?? '';
  return <JoinRoomClient roomId={roomId} />;
}
