import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function NewReportButton() {
  return (
    <Button asChild>
      <Link href='/dashboard/reports/new'>Nuevo reporte</Link>
    </Button>
  );
}
