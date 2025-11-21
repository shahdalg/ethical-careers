import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add any public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/thank-you', '/signup/survey'];

// Add paths that should always be accessible
const publicPaths = [
  '/_next',
  '/api',
  '/images',
  '/fonts',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  // NOTE:
  // Middleware cannot directly access Firebase client auth state.
  // Previously this file unconditionally redirected non-public pages to /login
  // which caused users to be redirected even after a successful sign-in.
  // To avoid blocking authenticated users without a server-side session cookie,
  // we will no-op here and let client-side protection (withAuth HOC) handle
  // redirects after Firebase initializes.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};