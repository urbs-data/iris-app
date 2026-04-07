'use client';

import { useMutation } from '@tanstack/react-query';
import { IconLoader2 } from '@tabler/icons-react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resolveActionResult } from '@/lib/actions/client';
import { generateAiPdfFromReport } from '../../actions/generate-ai-pdf-from-report';
import { getSasUri } from '@/features/shared/actions/get-sas-uri';

interface GenerateAiPdfButtonProps {
  reportId: string;
  translations: {
    buttonLabel: string;
    progressStart: string;
    progressRunning: string;
    progressOpening: string;
    success: string;
    successReused: string;
    error: string;
  };
}

export function GenerateAiPdfButton({
  reportId,
  translations
}: GenerateAiPdfButtonProps) {
  const mutation = useMutation({
    mutationFn: async () => {
      const loadingId = toast.loading(translations.progressStart);
      try {
        toast.message(translations.progressRunning, { id: loadingId });
        const payload = await resolveActionResult(
          generateAiPdfFromReport({ reportId })
        );
        const sasResult = await getSasUri({ blobPath: payload.blobPath });
        const sasUri = sasResult?.data?.sasUri;
        if (!sasUri) {
          throw new Error('No se pudo obtener URL SAS para el PDF IA');
        }

        toast.message(translations.progressOpening, { id: loadingId });
        const finalUrl = `${sasUri.split('#')[0]}#view=FitH`;
        window.open(finalUrl, '_blank');

        toast.success(
          payload.reused ? translations.successReused : translations.success,
          { id: loadingId }
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : translations.error,
          { id: loadingId }
        );
        throw error;
      }
    }
  });

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      title={translations.buttonLabel}
      aria-label={translations.buttonLabel}
    >
      {mutation.isPending ? (
        <IconLoader2 className='h-4 w-4 animate-spin' />
      ) : (
        <FileText className='h-4 w-4' />
      )}
    </Button>
  );
}
