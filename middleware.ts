import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes: Record<string, string> = { '/admin': 'ADMIN', '/staff': 'STAFF', '/portal': 'CUSTOMER' };
const rolePath: Record<string, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };
const authSecret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'brightloop-local-nextauth-secret-2026' : undefined);

export async function middleware(request: NextRequest) {
  const requiredRole = protectedRoutes[request.nextUrl.pathname];
  if (!requiredRole) return NextResponse.next();
  const token = await getToken({ req: request, secret: authSecret });
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (token.role !== requiredRole) return NextResponse.redirect(new URL(rolePath[String(token.role)] || '/', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/staff', '/portal'] };
