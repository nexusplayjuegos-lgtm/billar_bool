import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'es', 'pt'] as const;

const PROTECTED_SEGMENTS = ['/play', '/shop', '/friends', '/ranking', '/profile', '/settings'];

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
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
