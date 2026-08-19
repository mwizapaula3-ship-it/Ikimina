import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Unprotected routes that don't require auth
const unprotectedRoutes = ['/', '/login', '/api/auth/login', '/api/auth/register'];

// Role-specific route mappings
const roleRoutes: { [key: string]: string[] } = {
  SUPER_ADMIN: ['/super-admin'],
  GROUP_ADMIN: ['/admin', '/group'],
  TREASURER: ['/treasurer'],
  SECRETARY: ['/secretary'],
  MEMBER: ['/member'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unprotected routes
  if (unprotectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for valid token
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token (in a real app, you'd call your auth verification)
  // For now, just pass through for middleware purposes
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
