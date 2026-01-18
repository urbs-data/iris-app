'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Database,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveActionResult } from '@/lib/actions/client';
import { DocumentType } from '../lib/models';
import { useValidation } from '../context/validation-context';
import { validateDocuments } from '../actions/validate-documents';

const DOCUMENT_TYPES = [
  {
    type: DocumentType.PRELIMINAR,
    labelKey: 'documentTypes.preliminar',
    icon: FileSpreadsheet
  },
  { type: DocumentType.EDD, labelKey: 'documentTypes.edd', icon: Database },
  {
    type: DocumentType.MATRIX_SPIKE,
    labelKey: 'documentTypes.matrixSpike',
    icon: TrendingUp
  },
  {
    type: DocumentType.PARAMETROS,
    labelKey: 'documentTypes.parametros',
    icon: FlaskConical
  }
] as const;

const EXCEL_ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx'
  ],
  'application/vnd.ms-excel': ['.xls']
};

export function ValidationForm() {
  const router = useRouter();
  const t = useTranslations('validation');
  const { setResults } = useValidation();
  const [files, setFiles] = useState<Record<string, File | null>>({
    [DocumentType.PRELIMINAR]: null,
    [DocumentType.EDD]: null,
    [DocumentType.MATRIX_SPIKE]: null,
    [DocumentType.PARAMETROS]: null
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const documents = Object.entries(files)
        .filter(([_, file]) => file !== null)
        .map(([type, file]) => ({
          documentType: type as DocumentType,
          file: file!
        }));

      return resolveActionResult(validateDocuments({ documents }));
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(t('upload.success'));
      router.push('/dashboard/validate/results');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const hasFiles = Object.values(files).some((f) => f !== null);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {DOCUMENT_TYPES.map(({ type, labelKey, icon: Icon }) => (
          <Card key={type}>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Icon className='h-5 w-5' />
                {t(labelKey)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                value={files[type] ? [files[type]!] : []}
                onValueChange={(newFiles) => {
                  const fileArray =
                    typeof newFiles === 'function'
                      ? newFiles(files[type] ? [files[type]!] : [])
                      : newFiles;
                  setFiles((prev) => ({
                    ...prev,
                    [type]: fileArray?.[0] ?? null
                  }));
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                accept={EXCEL_ACCEPT}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-center'>
        <Button
          onClick={() => mutate()}
          disabled={!hasFiles || isPending}
          size='lg'
        >
          {isPending ? t('upload.processing') : t('upload.validateFiles')}
        </Button>
      </div>
    </div>
  );
}
