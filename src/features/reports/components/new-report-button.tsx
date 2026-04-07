import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function NewReportButton() {
  const t = useTranslations('reports');
  return (
    <Button asChild>
      <Link href='/dashboard/reports/new'>{t('new')}</Link>
    </Button>
  );
}
