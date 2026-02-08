'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormSelect } from '@/components/forms/form-select';
import { FileUploader } from '@/components/file-uploader';
import { useZodForm } from '@/hooks/use-zod-form';
import { resolveActionResult } from '@/lib/actions/client';
import { uploadDocuments } from '../actions/upload-documents';
import {
  uploadDocumentsSchema,
  UploadDocumentsSchema
} from '../actions/upload-documents-schema';
import {
  CLASSIFICATIONS_MAP,
  AREAS,
  Classification,
  DocumentType
} from '../constants/classifications';

export function UploadDocumentsForm() {
  const router = useRouter();
  const t = useTranslations('uploadDocument');
  const tClassifications = useTranslations('documentClassifications');
  const tSubclassifications = useTranslations('documentSubclassifications');
  const tDocumentTypes = useTranslations('documentTypes');
  const [files, setFiles] = useState<File[]>([]);

  const form = useZodForm({
    schema: uploadDocumentsSchema,
    mode: 'onBlur'
  });

  const selectedClassification = form.watch('classification');

  const classificationOptions = useMemo(
    () =>
      Object.values(Classification).map((value) => ({
        value,
        label: tClassifications(value)
      })),
    [tClassifications]
  );

  const subClassificationOptions = useMemo(() => {
    if (!selectedClassification) return [];

    const subclassifications =
      CLASSIFICATIONS_MAP[selectedClassification] || [];
    return subclassifications.map((value) => ({
      value,
      label: tSubclassifications(value)
    }));
  }, [selectedClassification, tSubclassifications]);

  const areaOptions = useMemo(
    () =>
      AREAS.map((value) => ({
        value,
        label: value
      })),
    []
  );

  const tipoOptions = useMemo(
    () =>
      Object.values(DocumentType).map((value) => ({
        value,
        label: tDocumentTypes(value)
      })),
    [tDocumentTypes]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: UploadDocumentsSchema) => {
      return resolveActionResult(uploadDocuments(data));
    },
    onSuccess: (data) => {
      toast.success(t('uploadSuccess'));
      router.push('/dashboard/explorer');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit: SubmitHandler<UploadDocumentsSchema> = async (data) => {
    mutate(data);
  };

  return (
    <Card className='mx-auto w-full'>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
            <div className='space-y-6'>
              <FormDatePicker
                control={form.control}
                name='date'
                label={t('documentDateLabel')}
                required
                config={{
                  placeholder: t('documentDatePlaceholder')
                }}
              />

              <FormSelect
                control={form.control}
                name='classification'
                label={t('classificationLabel')}
                placeholder={t('classificationPlaceholder')}
                required
                options={classificationOptions}
              />

              <FormSelect
                control={form.control}
                name='subClassification'
                label={t('subclassificationLabel')}
                placeholder={t('subclassificationPlaceholder')}
                options={subClassificationOptions}
                disabled={
                  !selectedClassification ||
                  subClassificationOptions.length === 0
                }
              />

              <FormSelect
                control={form.control}
                name='area'
                label={t('areaLabel')}
                placeholder={t('areaPlaceholder')}
                options={areaOptions}
              />

              <FormSelect
                control={form.control}
                name='tipo'
                label={t('tipoLabel')}
                placeholder={t('tipoPlaceholder')}
                options={tipoOptions}
              />
            </div>

            <div className='space-y-4'>
              <div>
                <label className='mb-2 block text-sm font-medium'>
                  {t('filesLabel')}
                  <span className='ml-1 text-red-500'>*</span>
                </label>
                <FileUploader
                  value={files}
                  onValueChange={(newFiles) => {
                    const fileArray =
                      typeof newFiles === 'function'
                        ? newFiles(files)
                        : newFiles;
                    setFiles(fileArray || []);
                    form.setValue('files', fileArray || [], {
                      shouldValidate: true
                    });
                  }}
                  maxFiles={10}
                  maxSize={100 * 1024 * 1024}
                  multiple
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                      ['.docx'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                      ['.xlsx'],
                    'application/vnd.ms-excel': ['.xls'],
                    'image/*': ['.jpg', '.jpeg', '.png'],
                    'text/*': ['.txt', '.csv']
                  }}
                />
                {form.formState.errors.files && (
                  <p className='mt-2 text-sm text-red-500'>
                    {t(form.formState.errors.files.message as any)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='flex gap-4'>
            <Button type='submit' disabled={isPending}>
              {isPending ? t('loading') : t('upload')}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/explorer')}
            >
              {t('cancel')}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
