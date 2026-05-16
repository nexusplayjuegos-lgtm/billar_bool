import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'es', 'pt'] as const;

const PROTECTED_SEGMENTS = ['/play', '/friends', '/leaderboard', '/profile', '/join'];

function isProtected(pathname: string): boolean {
  return PROTECTED_SEGMENTS.some((seg) =>
    LOCALES.some((loc) => pathname.startsWith(`/${loc}${seg}`))
  );
}

const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: 'pt',
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname)) {
    const hasAuth = req.cookies.has('bool_auth');
    const hasGuest = req.cookies.has('bool_guest');
    if (!hasAuth && !hasGuest) {
      const locale = LOCALES.find((l) => pathname.startsWith(`/${l}`)) ?? 'pt';
      const welcomeUrl = new URL(`/${locale}`, req.url);
      welcomeUrl.searchParams.set('redirect', `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(welcomeUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
