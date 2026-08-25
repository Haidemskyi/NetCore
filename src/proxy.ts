import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // If this is an API route, check for authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Exempt login, bootstrap, signing, portal, webhooks, and mobile v1 API routes from admin session cookie check
    if (
      request.nextUrl.pathname === '/api/auth/login' ||
      request.nextUrl.pathname === '/api/auth/logout' ||
      request.nextUrl.pathname === '/api/bootstrap' ||
      request.nextUrl.pathname.startsWith('/api/portal/') ||
      request.nextUrl.pathname.startsWith('/api/webhooks/') ||
      request.nextUrl.pathname.startsWith('/api/sign/') ||
      request.nextUrl.pathname.startsWith('/api/candidates/signing-link') ||
      request.nextUrl.pathname.startsWith('/api/candidates/upload-link') ||
      request.nextUrl.pathname.startsWith('/api/candidates/upload-docs') ||
      request.nextUrl.pathname.startsWith('/api/candidates/documents/download') ||
      request.nextUrl.pathname.startsWith('/api/v1/')
    ) {
      return NextResponse.next();
    }

    // Allow all requests in local development environment (localhost / 127.0.0.1)
    const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
    if (isLocal) {
      return NextResponse.next();
    }

    // Check for the netcore_session cookie for external production access
    const sessionCookie = request.cookies.get('netcore_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure middleware to only run on API routes
export const config = {
  matcher: '/api/:path*',
};
