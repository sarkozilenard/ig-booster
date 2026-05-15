import { NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from './lib/session';

const protectedPaths = ['/shop', '/checkout'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !verifyToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/shop', '/shop/:path*', '/checkout', '/checkout/:path*'],
};
