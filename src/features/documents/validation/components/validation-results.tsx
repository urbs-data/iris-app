'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useValidation } from '../context/validation-context';
import { ValidationResultData } from '../lib/models';
import { ValidationTabs } from './validation-tabs';
import { ValidationStatus } from './status-badge';
import { ExportPdfButton } from './export-pdf-button';

export function ValidationResultsContent() {
  const router = useRouter();
  const t = useTranslations('validation');
  const { results } = useValidation();
  const [selectedTab, setSelectedTab] = useState<ValidationStatus>('ERROR');

  if (!results) {
    router.push('/dashboard/validate');
    return null;
  }

  const statusCounts = useMemo(
    () => ({
      SUCCESS: results.filter((r) => r.estado === 'SUCCESS').length,
      WARNING: results.filter((r) => r.estado === 'WARNING').length,
      ERROR: results.filter((r) => r.estado === 'ERROR').length,
      SKIPPED: results.filter((r) => r.estado === 'SKIPPED').length
    }),
    [results]
  );

  const filteredResults = useMemo(
    () => results.filter((r) => r.estado === selectedTab),
    [results, selectedTab]
  );

  const groupedResults = useMemo(() => {
    const groups: Record<string, ValidationResultData[]> = {};
    filteredResults.forEach((result) => {
      const key = Object.values(result.archivos).join(', ');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    });

    // Ordenar los grupos por sus claves (nombres de archivo)
    const sortedEntries = Object.entries(groups).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    );
    return Object.fromEntries(sortedEntries);
  }, [filteredResults]);

  const handleNewValidation = () => {
    router.push('/dashboard/validate');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={handleNewValidation}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('reset')}
          </Button>
          <ExportPdfButton results={results} />
        </div>
      </div>

      <ValidationTabs
        statusCounts={statusCounts}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        groupedResults={groupedResults}
      />
    </div>
  );
}
