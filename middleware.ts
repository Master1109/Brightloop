import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const rolePrefix: Record<string, string> = { '/admin': 'ADMIN', '/staff': 'STAFF', '/portal': 'CUSTOMER' };
const rolePath: Record<string, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };
const authSecret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'brightloop-local-nextauth-secret-2026' : undefined);

function getRequiredRole(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(rolePrefix)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return role;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  const token = await getToken({ req: request, secret: authSecret });
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const tokenRole = String(token.role || '').toUpperCase();
  if (tokenRole !== requiredRole) {
    if (rolePath[tokenRole]) {
      return NextResponse.redirect(new URL(rolePath[tokenRole], request.url));
    }
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/portal/:path*'],
};
