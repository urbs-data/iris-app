'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { IconRefresh, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { reindexDocument } from '../actions/reindex-document';

interface ReindexButtonProps {
  blobPath: string;
  disabled?: boolean;
}

export function ReindexButton({
  blobPath,
  disabled = false
}: ReindexButtonProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('fileExplorer');

  async function handleReindex() {
    setLoading(true);
    const toastId = toast.loading(t('reindexing'));

    try {
      const result = await reindexDocument({ blobPath });

      if (result?.data?.success) {
        toast.success(t('reindexSuccess', { chunks: result.data.chunks }), {
          id: toastId
        });
      } else {
        toast.error(result?.serverError || t('reindexError'), { id: toastId });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('unknownError');
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant='outline'
      size='sm'
      title={t('reindex')}
      onClick={handleReindex}
      disabled={loading || disabled}
    >
      {loading ? (
        <IconLoader2 className='h-4 w-4 animate-spin' />
      ) : (
        <IconRefresh className='h-4 w-4' />
      )}
    </Button>
  );
}
