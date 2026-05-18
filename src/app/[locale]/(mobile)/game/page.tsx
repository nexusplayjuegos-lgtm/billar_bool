import { redirect } from 'next/navigation';

export default function GameIndexPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/game/mode_8ball_london`);
}
