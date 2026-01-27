import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/:lang/dashboard(.*)']);
const isSelectTenantRoute = createRouteMatcher([
  '/:lang/auth/select-tenant(.*)'
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const isSentryRoute = pathname.startsWith('/monitoring');

  if (isSentryRoute) {
    return NextResponse.next();
  }

  const localeRedirect = intlMiddleware(req);
  if (localeRedirect) return localeRedirect;

  const { userId, orgId } = await auth();

  if (isProtectedRoute(req)) {
    if (!userId) {
      await auth.protect();
      return;
    }

    if (!orgId) {
      const locale = pathname.split('/')[1] || defaultLocale;
      const selectTenantUrl = new URL(`/${locale}/auth/select-tenant`, req.url);
      return NextResponse.redirect(selectTenantUrl);
    }
  }

  if (isSelectTenantRoute(req) && userId && orgId) {
    const locale = pathname.split('/')[1] || defaultLocale;
    const dashboardUrl = new URL(`/${locale}/dashboard`, req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (isSelectTenantRoute(req) && !userId) {
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
