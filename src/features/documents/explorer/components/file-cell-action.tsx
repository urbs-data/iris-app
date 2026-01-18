'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconDotsVertical, IconDownload, IconTrash } from '@tabler/icons-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DownloadButton } from '@/features/shared/components/download-button';
import { deleteDocument } from '../actions/delete-document';
import type { FileItem } from '../lib/types';

interface FileCellActionProps {
  file: FileItem;
}

export function FileCellAction({ file }: FileCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);

      const result = await deleteDocument({ blobPath: file.id });

      if (result?.data?.success) {
        let message = result.data.message || 'Archivo eliminado correctamente';

        toast.success(message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error al eliminar el archivo');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
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
      <div className='flex justify-end gap-2'>
        <DownloadButton blobPath={file.id} />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Abrir menú</span>
              <IconDotsVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <div className='flex w-full cursor-pointer items-center'>
                <IconDownload className='mr-2 h-4 w-4' />
                Descargar
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className='text-destructive focus:text-destructive'
            >
              <IconTrash className='mr-2 h-4 w-4' />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
