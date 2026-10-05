import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['fr', 'en', 'ar'];
const defaultLocale = 'fr';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- 0. WAF (Web Application Firewall) ---
  const userAgent = request.headers.get('user-agent') || '';
  const badBots = ['curl', 'wget', 'python-requests', 'scrapy', 'postmanruntime', 'go-http-client', 'java'];
  if (badBots.some(bot => userAgent.toLowerCase().includes(bot))) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Access denied: Security Firewall Blocked Request' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  const fullUrl = request.url.toLowerCase();
  const sqlKeywords = ['select%20', 'union%20', 'insert%20', 'delete%20', 'update%20', 'drop%20', '1=1', '%27', 'script%3e'];
  if (sqlKeywords.some(keyword => fullUrl.includes(keyword))) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Access denied: Malicious Payload' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  if (pathname.includes('.env') || pathname.includes('.git')) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Access denied' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // --- 1. ADMIN SECURITY ---
  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin') && !isLoginPage;
  const isAdminApiRoute = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

  if (isLoginPage) {
    const token = request.cookies.get('admin_token')?.value || request.cookies.get('admin_session')?.value;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // Token invalid, allow to login page
      }
    }
  }

  if (isAdminRoute || isAdminApiRoute) {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = bearerToken || request.cookies.get('admin_token')?.value || request.cookies.get('admin_session')?.value;

    let isValid = false;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        isValid = true;
      } catch (error) {
        console.error('Invalid token in middleware:', error);
      }
    }

    if (!isValid) {
      if (isAdminApiRoute) {
        return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
  }

  // --- 2. STATIC FILES & API ROUTES (Except Admin) ---
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- 3. LOCALE REDIRECTION ---
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const url = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
