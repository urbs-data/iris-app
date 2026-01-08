'use client';

import { useState } from 'react';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { getSasUri } from '../actions/get-sas-uri';

interface DownloadButtonProps {
  blobPath: string;
  page?: number;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function DownloadButton({ blobPath, page }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDownload() {
    setIsLoading(true);
    try {
      const result = await getSasUri({ blobPath });

      if (!result?.data?.sasUri) {
        throw new Error('No se pudo obtener la URL de descarga');
      }

      const sasUri = result.data.sasUri;
      const extension = getFileExtension(blobPath);

      if (extension === 'pdf') {
        const baseUrl = sasUri.split('#')[0];
        const finalUrl = page
          ? `${baseUrl}#page=${page}`
          : `${baseUrl}#view=FitH`;
        window.open(finalUrl, '_blank');
      } else {
        window.open(sasUri, '_blank');
      }
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <IconLoader2 className='h-4 w-4 animate-spin' />
      ) : (
        <IconDownload className='h-4 w-4' />
      )}
    </Button>
  );
}
