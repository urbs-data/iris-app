'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconTrash, IconLoader2 } from '@tabler/icons-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { deleteDocument } from '@/features/documents/explorer/actions/delete-document';
import { useTranslations } from 'next-intl';

interface DeleteButtonProps {
  blobPath: string;
  disabled?: boolean;
}

export function DeleteButton({
  blobPath,
  disabled = false
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('documents.explorer');

  const onConfirm = async () => {
    try {
      setLoading(true);

      const result = await deleteDocument({ blobPath });

      if (result?.data?.success) {
        const message = t('fileDeleted');

        toast.success(message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(t('fileDeleteError'));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('unknownError');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <Button
        variant='destructive'
        size='sm'
        onClick={() => setOpen(true)}
        disabled={loading || disabled}
      >
        {loading ? (
          <IconLoader2 className='h-4 w-4 animate-spin' />
        ) : (
          <IconTrash className='h-4 w-4' />
        )}
      </Button>
    </>
  );
}
