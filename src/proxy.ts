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
    const res = NextResponse.next();
    if (pathname.startsWith('/api/orders')) {
      res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Referrer-Policy', 'no-referrer');
    }
    return res;
  }

  // --- 2.5. PERMANENT 301 REDIRECTS (OBSOLETE / LEGACY PRODUCT & CATEGORY URLS) ---
  const legacyExactRedirects: Record<string, string> = {
    // Categories & Catalogues
    "/categories/hommes": "/fr/shop/men",
    "/fr/categories/hommes": "/fr/shop/men",
    "/ar/categories/hommes": "/ar/shop/men",
    "/categories/femmes": "/fr/shop/women",
    "/fr/categories/femmes": "/fr/shop/women",
    "/ar/categories/femmes": "/ar/shop/women",
    "/categories/unisex": "/fr/shop/unisex",
    "/fr/categories/unisex": "/fr/shop/unisex",
    "/ar/categories/unisex": "/ar/shop/unisex",
    "/catalogue/testeurs": "/fr/testeurs",
    "/fr/catalogue/testeurs": "/fr/testeurs",
    "/ar/catalogue/testeurs": "/ar/testeurs",
    "/collections/oud-oriental": "/fr/parfums-orientaux",
    "/fr/collections/oud-oriental": "/fr/parfums-orientaux",
    "/ar/collections/oud-oriental": "/ar/parfums-orientaux",
    "/blog/top-parfums-homme-longue-tenue": "/fr/blog",
    "/fr/blog/top-parfums-homme-longue-tenue": "/fr/blog",
    "/ar/blog/top-parfums-homme-longue-tenue": "/ar/blog",
    "/track-order": "/fr/suivi-commande",
    "/fr/track-order": "/fr/suivi-commande",
    "/ar/track-order": "/ar/suivi-commande",
    "/privacy": "/fr/legal/privacy",
    "/terms": "/fr/legal/terms",
    "/returns": "/fr/legal/returns",

    // Specific product legacy slugs
    "/products/sauvage-dior": "/fr/product/Sauvage-Eau-De-Parfum",
    "/fr/products/sauvage-dior": "/fr/product/Sauvage-Eau-De-Parfum",
    "/product/sauvage-dior": "/fr/product/Sauvage-Eau-De-Parfum",
    "/fr/product/sauvage-dior": "/fr/product/Sauvage-Eau-De-Parfum",
    "/products/bleu-de-chanel": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/fr/products/bleu-de-chanel": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/product/bleu-de-chanel": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/fr/product/bleu-de-chanel": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/products/baccarat-rouge-540": "/fr/product/baccarat-rouge-540-tester",
    "/fr/products/baccarat-rouge-540": "/fr/product/baccarat-rouge-540-tester",
    "/product/baccarat-rouge-540": "/fr/product/baccarat-rouge-540-tester",
    "/fr/product/baccarat-rouge-540": "/fr/product/baccarat-rouge-540-tester",

    // Existing legacy redirects
    "/fr/product/Yves-Saint-Laurent-La-Nuit-De-L'Homme-Bleu-Électrique-Eau-de-Toilette": "/fr/product/YSL-La-Nuit-De-L-Homme-Bleu-Électrique-Eau-de-Toilette",
    "/product/Yves-Saint-Laurent-La-Nuit-De-L'Homme-Bleu-Électrique-Eau-de-Toilette": "/fr/product/YSL-La-Nuit-De-L-Homme-Bleu-Électrique-Eau-de-Toilette",
    "/product/Absolu-Aventus-Creed": "/fr/product/Creed-Absolu-Aventus-Tester",
    "/fr/product/Absolu-Aventus-Creed": "/fr/product/Creed-Absolu-Aventus-Tester",
    "/product/chanel-bleu-de-chanel-tester": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/fr/product/chanel-bleu-de-chanel-tester": "/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester",
    "/product/pack-decouverte-luxe": "/fr/decouverte",
    "/fr/product/pack-decouverte-luxe": "/fr/decouverte",
    "/fr/product/Pack-louis-Vuitton-Imagination L'Immensité": "/fr/brands/Louis-Vuitton",
    "/fr/product/Pack-louis-Vuitton-Imagination%20L'Immensit%C3%A9": "/fr/brands/Louis-Vuitton",
    "/product/Pack-louis-Vuitton-Imagination L'Immensité": "/fr/brands/Louis-Vuitton",
    "/product/Pack-louis-Vuitton-Imagination%20L'Immensit%C3%A9": "/fr/brands/Louis-Vuitton",

    // Sprint 46 verified 1-hop exact redirects for 13 legacy variant slugs with exact catalog matches
    "/product/Jean Paul Gaultier-jpg-le-male-elixir-tester": "/fr/product/Jean-Paul-Gaultier-jpg-le-male-elixir-tester",
    "/product/Jean%20Paul%20Gaultier-jpg-le-male-elixir-tester": "/fr/product/Jean-Paul-Gaultier-jpg-le-male-elixir-tester",
    "/fr/product/Jean Paul Gaultier-jpg-le-male-elixir-tester": "/fr/product/Jean-Paul-Gaultier-jpg-le-male-elixir-tester",
    "/fr/product/Jean%20Paul%20Gaultier-jpg-le-male-elixir-tester": "/fr/product/Jean-Paul-Gaultier-jpg-le-male-elixir-tester",

    "/product/parfums-de-marly-layton-eau-de-parfum-tester": "/fr/product/layton-parfums-de-marly-layton-eau-de-parfum-tester",
    "/fr/product/parfums-de-marly-layton-eau-de-parfum-tester": "/fr/product/layton-parfums-de-marly-layton-eau-de-parfum-tester",

    "/product/lost-cherry-tester": "/fr/product/lost-cherry-tom-ford-tester",
    "/fr/product/lost-cherry-tester": "/fr/product/lost-cherry-tom-ford-tester",

    "/product/cinema-tester": "/fr/product/cinéma-yves-saint-laurent-cinema-tester",
    "/fr/product/cinema-tester": "/fr/product/cinéma-yves-saint-laurent-cinema-tester",

    "/product/armani-stronger-with-you-intensely-tester": "/fr/product/stronger-with-you-intensely-tester",
    "/fr/product/armani-stronger-with-you-intensely-tester": "/fr/product/stronger-with-you-intensely-tester",

    "/product/tom-ford-fabulous-tester": "/fr/product/fabulous-tom-ford-tester",
    "/fr/product/tom-ford-fabulous-tester": "/fr/product/fabulous-tom-ford-tester",

    "/product/yves-saint-laurent-ysl-myself-eau-de-parfum-tester": "/fr/product/yves-saint-laurent-ysl-myslf-eau-de-parfum-tester-1",
    "/fr/product/yves-saint-laurent-ysl-myself-eau-de-parfum-tester": "/fr/product/yves-saint-laurent-ysl-myslf-eau-de-parfum-tester-1",

    "/product/my-way-tester": "/fr/product/my-way-EDP-tester",
    "/fr/product/my-way-tester": "/fr/product/my-way-EDP-tester",

    "/product/armani-prive-vert-malachite-eau-de-parfum-tester": "/fr/product/vert-malachite-armani-prive-eau-de-parfum-tester",
    "/fr/product/armani-prive-vert-malachite-eau-de-parfum-tester": "/fr/product/vert-malachite-armani-prive-eau-de-parfum-tester",

    "/product/dior-sauvage-elixir-eau-de-parfum-tester": "/fr/product/dior-sauvage-elixir-tester",
    "/fr/product/dior-sauvage-elixir-eau-de-parfum-tester": "/fr/product/dior-sauvage-elixir-tester",

    "/product/dolce-gabbana-the-one-tester": "/fr/product/dolce-gabbana-the-one-eau-de-parfum-tester",
    "/fr/product/dolce-gabbana-the-one-tester": "/fr/product/dolce-gabbana-the-one-eau-de-parfum-tester",

    "/product/miss-dior-le-parfum-tester": "/fr/product/miss-dior-parfum-tester",
    "/fr/product/miss-dior-le-parfum-tester": "/fr/product/miss-dior-parfum-tester",

    "/product/black-opium-overed-tester": "/fr/product/black-opium-overed-ysl-tester",
    "/fr/product/black-opium-overed-tester": "/fr/product/black-opium-overed-ysl-tester",
    // (Discontinued items without catalog equivalents handled below via explicit HTTP 404 to prevent Soft 404s)
  };

  let decodedPath = pathname;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {}

  // Legitimate 404 for discontinued perfumes with no direct catalog equivalent
  // Follows Google official site migration guidance: avoids Soft 404 degradation on brand hubs
  const discontinuedGaps = [
    '/product/dolce-gabbana-the-one-desire-eau-de-parfum-tester',
    '/fr/product/dolce-gabbana-the-one-desire-eau-de-parfum-tester',
    '/product/scandal-tester',
    '/fr/product/scandal-tester',
    '/product/versace-eros-tester',
    '/fr/product/versace-eros-tester',
    '/product/dior-poison-girl-eau-de-parfum-tester',
    '/fr/product/dior-poison-girl-eau-de-parfum-tester',
    '/product/yves-saint-laurent-y-le-parfum-tester',
    '/fr/product/yves-saint-laurent-y-le-parfum-tester',
    '/product/yves-saint-laurent-myslf-absolu-tester',
    '/fr/product/yves-saint-laurent-myslf-absolu-tester',
  ];
  if (discontinuedGaps.includes(pathname) || discontinuedGaps.includes(decodedPath)) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }

  const matchedRedirect = legacyExactRedirects[pathname] || legacyExactRedirects[decodedPath];
  if (matchedRedirect) {
    return NextResponse.redirect(new URL(`${matchedRedirect}${request.nextUrl.search}`, request.url), 301);
  }

  // Dynamic regex for plural /products/ -> singular /product/
  // Handles: /products/:slug, /fr/products/:slug, /ar/products/:slug, /en/products/:slug
  const pluralProductsMatch = pathname.match(/^(\/(fr|ar|en))?\/products(\/(.*))?$/);
  if (pluralProductsMatch) {
    const loc = pluralProductsMatch[2] || defaultLocale;
    const rest = pluralProductsMatch[3] || '';
    return NextResponse.redirect(new URL(`/${loc}/product${rest}${request.nextUrl.search}`, request.url), 301);
  }

  // Dynamic 301 for unlocalized single product: /product/:slug -> /fr/product/:slug
  const unlocalizedProductMatch = pathname.match(/^\/product(\/(.*))?$/);
  if (unlocalizedProductMatch) {
    const rest = unlocalizedProductMatch[1] || '';
    return NextResponse.redirect(new URL(`/fr/product${rest}${request.nextUrl.search}`, request.url), 301);
  }

  // Dynamic 301 for unlocalized brands: /brands/:slug -> /fr/brands/:slug
  const unlocalizedBrandsMatch = pathname.match(/^\/brands(\/(.*))?$/);
  if (unlocalizedBrandsMatch) {
    const rest = unlocalizedBrandsMatch[1] || '';
    return NextResponse.redirect(new URL(`/fr/brands${rest}${request.nextUrl.search}`, request.url), 301);
  }

  // --- 3. LOCALE REDIRECTION ---
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const targetPath = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
    const url = new URL(`${targetPath}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(url, 308);
  }

  const res = NextResponse.next();
  if (pathname.includes('/invoice')) {
    res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Referrer-Policy', 'no-referrer');
  }
  return res;
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
