import { JoinRoomClient } from './JoinRoomClient';

interface Props {
  searchParams: { room?: string };
}

export default function JoinPage({ searchParams }: Props) {
  const roomId = searchParams.room ?? '';
  return <JoinRoomClient roomId={roomId} />;
}
