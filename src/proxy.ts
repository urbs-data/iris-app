import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { i18n } from './i18n-config';

const isProtectedRoute = createRouteMatcher(['/:lang/dashboard(.*)']);

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return i18n.defaultLocale;

  // Extraer el primer idioma preferido
  const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0];

  // Verificar si el idioma está soportado
  if (
    preferredLocale &&
    i18n.locales.includes(preferredLocale as (typeof i18n.locales)[number])
  ) {
    return preferredLocale;
  }

  return i18n.defaultLocale;
}

function handleLocaleRedirect(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  // Verificar si ya hay un locale en el pathname
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirigir si no hay locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Primero manejar la redirección de locale
  const localeRedirect = handleLocaleRedirect(req);
  if (localeRedirect) return localeRedirect;

  // Proteger rutas que lo requieran
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
