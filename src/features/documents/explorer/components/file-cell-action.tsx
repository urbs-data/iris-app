'use client';

import { DownloadButton } from '@/features/shared/components/download-button';
import { DeleteButton } from '@/features/shared/components/delete-button';
import type { FileItem } from '../lib/types';

interface FileCellActionProps {
  file: FileItem;
}

export function FileCellAction({ file }: FileCellActionProps) {
  return (
    <div className='items-left justify-left flex gap-2'>
      <DownloadButton blobPath={file.id} />
      <DeleteButton blobPath={file.id} />
    </div>
  );
}
