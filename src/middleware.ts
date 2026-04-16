import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (_auth, req: NextRequest) => {
  // All routes are public; auth is checked client-side per-component
  return intlMiddleware(req) ?? NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
