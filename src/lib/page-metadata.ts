import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export function titleMetadata(messageKey: string) {
  return async ({
    params
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> => {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    return { title: t(messageKey) };
  };
}
