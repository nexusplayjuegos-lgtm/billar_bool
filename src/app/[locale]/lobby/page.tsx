import { redirect } from 'next/navigation';

export default function LobbyRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}`);
}
