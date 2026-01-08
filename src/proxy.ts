import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/:lang/dashboard(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Primero manejar la redirección de locale
  const localeRedirect = intlMiddleware(req);
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
