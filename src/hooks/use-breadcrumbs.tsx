'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('components.breadcrumbs');
  const currentLocale = useLocale();

  // This allows to add custom title as well
  const routeMapping: Record<string, BreadcrumbItem[]> = {
    '/dashboard/general': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('dashboard-general'), link: '/dashboard/general' }
    ],
    '/dashboard/substance': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('dashboard-substance'), link: '/dashboard/substance' }
    ],
    '/dashboard/search': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('search'), link: '/dashboard/search' }
    ],
    '/dashboard/explorer': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('explorer'), link: '/dashboard/explorer' }
    ],
    '/dashboard/explorer/upload': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('explorer'), link: '/dashboard/explorer' },
      { title: t('upload'), link: '/dashboard/explorer/upload' }
    ],
    '/dashboard/validate': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('validate'), link: '/dashboard/validate' }
    ],
    '/dashboard/reports': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('reports'), link: '/dashboard/reports' }
    ],
    '/dashboard/reports/new': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('reports'), link: '/dashboard/reports' },
      { title: t('new'), link: '/dashboard/reports/new' }
    ],
    '/dashboard/validate/results': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('validate'), link: '/dashboard/validate' },
      { title: t('results'), link: '/dashboard/validate/results' }
    ],
    '/dashboard/profile': [
      { title: t('dashboard'), link: '/dashboard' },
      { title: t('profile'), link: '/dashboard/profile' }
    ]
  };

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    const pathNameWithoutLocale = pathname.replace(`/${currentLocale}`, '');
    if (routeMapping[pathNameWithoutLocale]) {
      return routeMapping[pathNameWithoutLocale];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
