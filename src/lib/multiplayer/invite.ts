const SITE_URL = 'https://8bollpool.com';

export function getRoomInviteUrl(locale: string, roomId: string): string {
  const url = new URL(`/${locale}/join`, SITE_URL);
  url.searchParams.set('room', roomId);
  return url.toString();
}

export function getWhatsAppInviteUrl(locale: string, roomId: string): string {
  const inviteUrl = getRoomInviteUrl(locale, roomId);
  const text = `Joga sinuca comigo! ${inviteUrl}`;
  const url = new URL('https://wa.me/');
  url.searchParams.set('text', text);
  return url.toString();
}
