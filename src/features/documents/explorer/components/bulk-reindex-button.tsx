'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { IconRefresh, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { reindexDocument } from '../actions/reindex-document';

interface BulkReindexButtonProps {
  blobPaths: string[];
  onComplete?: () => void;
}

export function BulkReindexButton({
  blobPaths,
  onComplete
}: BulkReindexButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('fileExplorer');

  async function handleReindex() {
    setLoading(true);
    const total = blobPaths.length;
    let succeeded = 0;
    let failed = 0;
    const toastId = toast.loading(t('bulkReindexProgress', { done: 0, total }));

    // Secuencial a propósito: el parseo con Document Intelligence es pesado y
    // en paralelo se come la cuota del servicio.
    for (let i = 0; i < blobPaths.length; i++) {
      try {
        const result = await reindexDocument({ blobPath: blobPaths[i] });
        if (result?.data?.success) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
      toast.loading(t('bulkReindexProgress', { done: i + 1, total }), {
        id: toastId
      });
    }

    if (failed === 0) {
      toast.success(t('bulkReindexSuccess', { count: succeeded }), {
        id: toastId
      });
    } else if (succeeded === 0) {
      toast.error(t('bulkReindexError', { count: failed }), { id: toastId });
    } else {
      toast.warning(t('bulkReindexPartial', { succeeded, total, failed }), {
        id: toastId
      });
    }

    setLoading(false);
    onComplete?.();
    router.refresh();
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleReindex}
      disabled={loading || blobPaths.length === 0}
    >
      {loading ? (
        <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <IconRefresh className='mr-2 h-4 w-4' />
      )}
      {t('reindex')} {blobPaths.length}
    </Button>
  );
}
