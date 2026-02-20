import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ClerkProvider } from '@clerk/nextjs';
import { enUS, esES } from '@clerk/localizations';
import { NiceModalProvider } from '@/components/layout/nice-modal-provider';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  const localization = locale === 'es' ? esES : enUS;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <NextIntlClientProvider locale={locale}>
      <ClerkProvider localization={localization}>
        <NiceModalProvider>{children}</NiceModalProvider>
      </ClerkProvider>
    </NextIntlClientProvider>
  );
}
