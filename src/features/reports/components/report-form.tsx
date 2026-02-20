'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { resolveActionResult } from '@/lib/actions/client';
import { getWells } from '@/features/dashboards/substance/data/get-wells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Form } from '@/components/ui/form';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { exportReport } from '../actions/export-report';
import {
  REPORT_TYPES,
  PRESET_OPTIONS,
  type ReportType,
  type PresetValue,
  type ExportedReportPayload
} from '../lib/types';

function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const bytes = new Uint8Array(arrayBuffer);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return arrayBuffer;
}

function triggerDownload(payload: ExportedReportPayload): void {
  const arrayBuffer = decodeBase64(payload.base64);
  const blob = new Blob([arrayBuffer], { type: payload.contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = payload.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function formatDateValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface FormValues {
  fechaDesde?: Date;
  fechaHasta?: Date;
  wells: string[];
}

export function ReportForm() {
  const t = useTranslations('reports');
  const today = new Date();

  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [preset, setPreset] = useState<PresetValue | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      fechaDesde: today,
      fechaHasta: today,
      wells: []
    }
  });

  const reportTypeOptions = useMemo(
    () =>
      REPORT_TYPES.map((value) => ({
        value,
        label: t(`types.${value}`)
      })),
    [t]
  );

  const presetOptions = useMemo(
    () =>
      PRESET_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label
      })),
    []
  );

  const { data: wellsData = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['reports-wells'],
    queryFn: () => resolveActionResult(getWells({}))
  });

  const wellOptions = useMemo(
    () => wellsData.map((w) => ({ value: w.value, label: w.label })),
    [wellsData]
  );

  const handleReportTypeChange = (value: string | null) => {
    setReportType((value as ReportType) ?? null);
    if (value) setPreset(null);
  };

  const handlePresetChange = (value: string | null) => {
    setPreset((value as PresetValue) ?? null);
    if (value) setReportType(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { fechaDesde, fechaHasta, wells } = form.getValues();

      if (!fechaDesde || !fechaHasta) {
        throw new Error(t('export.missingDates'));
      }

      const desde = formatDateValue(fechaDesde);
      const hasta = formatDateValue(fechaHasta);

      return resolveActionResult(
        exportReport({
          reportType: reportType ?? undefined,
          preset: preset ?? undefined,
          fechaDesde: desde,
          fechaHasta: hasta,
          pozos: wells
        })
      );
    },
    onSuccess: (payload) => {
      triggerDownload(payload);
      toast.success(t('export.success'));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('export.error'));
    }
  });

  const hasSelection = !!reportType || !!preset;
  const isDisabled = !hasSelection || mutation.isPending;

  return (
    <Card>
      <CardContent>
        <Form form={form} onSubmit={(e) => e.preventDefault()}>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('fields.reportType')}</Label>
              <Combobox
                value={reportType ?? ''}
                onValueChange={handleReportTypeChange}
                options={reportTypeOptions}
                placeholder={t('fields.reportType')}
                searchPlaceholder={t('fields.reportTypeSearch')}
                emptyMessage={t('fields.empty')}
              />
            </div>

            <div className='space-y-2'>
              <Label>{t('fields.preset')}</Label>
              <Combobox
                value={preset ?? ''}
                onValueChange={handlePresetChange}
                options={presetOptions}
                placeholder={t('fields.preset')}
                searchPlaceholder={t('fields.presetSearch')}
                emptyMessage={t('fields.empty')}
              />
            </div>

            <FormDatePicker
              control={form.control}
              name='fechaDesde'
              label={t('fields.from')}
              config={{ placeholder: t('fields.from') }}
              className='w-full'
            />
            <FormDatePicker
              control={form.control}
              name='fechaHasta'
              label={t('fields.to')}
              config={{ placeholder: t('fields.to') }}
              className='w-full'
            />

            <div className='space-y-2'>
              <Label>{t('fields.wells')}</Label>
              <MultiSelect
                values={form.watch('wells')}
                onValuesChange={(values) =>
                  form.setValue('wells', values, { shouldDirty: true })
                }
                options={wellOptions}
                placeholder={t('fields.wellsPlaceholder')}
                searchPlaceholder={t('fields.wellsSearch')}
                isLoading={isLoadingWells}
              />
            </div>

            <Button
              className='w-full'
              onClick={() => mutation.mutate()}
              disabled={isDisabled}
            >
              <Download className='h-4 w-4' />
              {mutation.isPending
                ? t('export.downloading')
                : t('export.download')}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
