import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add any public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/']; // Added home page to public routes

// Add paths that should always be accessible
const publicPaths = [
  '/_next',
  '/api',
  '/images',
  '/fonts',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is public
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Check if the path is a static resource
  if (publicPaths.some(prefix => path.startsWith(prefix)) || path.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next();
  }

  // For all other routes, redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};