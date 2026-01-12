import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/:lang/dashboard(.*)']);
const isSelectTenantRoute = createRouteMatcher(['/:lang/select-tenant(.*)']);
const isLocaleRootRoute = createRouteMatcher(['/:lang', '/:lang/']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Run next-intl middleware first.
  // It may return a redirect/rewrite response OR a normal "next" response with headers/cookies.
  const intlResponse = intlMiddleware(req);

  // Only short-circuit when next-intl is actually redirecting (e.g. / -> /es).
  const intlLocation = intlResponse?.headers?.get('location');
  if (intlLocation) return intlResponse;

  const { userId, orgId } = await auth();

  // If the user hits the locale root (e.g. /es), redirect to an actual page.
  if (isLocaleRootRoute(req)) {
    const locale = pathname.split('/')[1] || defaultLocale;

    if (!userId) {
      const signInUrl = new URL(`/${locale}/auth/sign-in`, req.url);
      const res = NextResponse.redirect(signInUrl);
      intlResponse?.headers?.forEach((value, key) =>
        res.headers.set(key, value)
      );
      return res;
    }

    if (!orgId) {
      const selectTenantUrl = new URL(`/${locale}/select-tenant`, req.url);
      const res = NextResponse.redirect(selectTenantUrl);
      intlResponse?.headers?.forEach((value, key) =>
        res.headers.set(key, value)
      );
      return res;
    }

    const dashboardUrl = new URL(`/${locale}/dashboard`, req.url);
    const res = NextResponse.redirect(dashboardUrl);
    intlResponse?.headers?.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  if (isProtectedRoute(req)) {
    if (!userId) {
      await auth.protect();
      return;
    }

    if (!orgId) {
      const locale = pathname.split('/')[1] || defaultLocale;
      const selectTenantUrl = new URL(`/${locale}/select-tenant`, req.url);
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

  // Fall through: return the next-intl response (typically NextResponse.next()).
  return intlResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
