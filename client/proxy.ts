import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_KEY } from './lib/constants';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const privatePaths = [
    '/',
    '/bookings',
    '/bookings/:id',
    '/profile',
    '/service/:id',
    '/service-categories',
    '/chats',
    '/chats/:id',
  ];
  const isPublicPath = publicPaths.includes(path);
  const isPrivatePath = privatePaths.includes(path);

  const token = request.cookies.get(TOKEN_KEY)?.value || '';

  if (path === '/verify-otp') return NextResponse.next();

  if (isPrivatePath && token) return NextResponse.next();

  if (isPublicPath && token) return NextResponse.redirect(new URL('/', request.nextUrl));

  if (!isPublicPath && !token) return NextResponse.redirect(new URL('/login', request.nextUrl));
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/bookings',
    '/bookings/:id',
    '/profile',
    '/service/:id',
    '/service-categories',
    '/chats',
    '/chats/:id',
  ],
};
