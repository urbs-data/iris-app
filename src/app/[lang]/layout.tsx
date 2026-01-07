import { i18n } from '@/i18n-config';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validar que el locale sea soportado
  if (!i18n.locales.includes(lang as (typeof i18n.locales)[number])) {
    notFound();
  }

  return <>{children}</>;
}
