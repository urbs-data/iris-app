'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconTrash, IconLoader2 } from '@tabler/icons-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { deleteDocument } from '../actions/delete-document';

interface BulkDeleteButtonProps {
  blobPaths: string[];
  onComplete?: () => void;
}

export function BulkDeleteButton({
  blobPaths,
  onComplete
}: BulkDeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    setOpen(false);
    setLoading(true);
    const total = blobPaths.length;
    let succeeded = 0;
    let failed = 0;
    const toastId = toast.loading(`Eliminando 0 de ${total}...`);

    for (let i = 0; i < blobPaths.length; i++) {
      const blobPath = blobPaths[i];
      try {
        const result = await deleteDocument({ blobPath });
        if (result?.data?.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      toast.loading(`Eliminando ${i + 1} de ${total}...`, { id: toastId });
    }

    if (failed === 0) {
      toast.success(`${succeeded} archivo(s) eliminados correctamente`, {
        id: toastId
      });
    } else if (succeeded === 0) {
      toast.error(`Error al eliminar ${failed} archivo(s)`, { id: toastId });
    } else {
      toast.warning(
        `Eliminados ${succeeded} de ${total} (${failed} fallaron)`,
        { id: toastId }
      );
    }

    setLoading(false);
    onComplete?.();
    router.refresh();
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
        disabled={loading || blobPaths.length === 0}
      >
        {loading ? (
          <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <IconTrash className='mr-2 h-4 w-4' />
        )}
        Eliminar {blobPaths.length}
      </Button>
    </>
  );
}
