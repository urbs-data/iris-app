'use client';

import { usePathname, useRouter } from 'next/navigation';
import { i18n, type Locale } from '@/i18n-config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconLanguage } from '@tabler/icons-react';

const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English'
};

const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇺🇸'
};

export function LangSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  // Extraer el locale actual del pathname
  const currentLocale =
    i18n.locales.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    ) || i18n.defaultLocale;

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Reemplazar el locale en el pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-9 w-9'>
          <span className='text-base'>
            {localeFlags[currentLocale as Locale]}
          </span>
          <span className='sr-only'>Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {i18n.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            <span className='mr-2'>{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
