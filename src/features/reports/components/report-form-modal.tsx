'use client';

import NiceModal from '@ebay/nice-modal-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { resolveActionResult } from '@/lib/actions/client';
import { getWells } from '@/features/dashboards/substance/data/get-wells';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormCombobox } from '@/components/forms/form-combobox';
import { FormMultiSelect } from '@/components/forms/form-multi-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { exportReport } from '../actions/export-report';
import {
  REPORT_TYPES,
  PRESET_OPTIONS,
  type ReportType,
  type PresetValue,
  type ExportedReportPayload
} from '../lib/types';

type ReportMode = 'preset' | 'specific';

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
  preset: string;
  reportType: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  wells: string[];
}

function ModeCard({
  selected,
  onClick,
  title,
  description
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-border bg-muted/50 hover:border-muted-foreground/25'
      )}
    >
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-foreground text-lg font-semibold'>{title}</span>
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-white',
            selected
              ? 'border-primary border-4'
              : 'border-muted-foreground/30 border-2'
          )}
        />
      </div>
      <p className='text-muted-foreground text-sm leading-tight'>
        {description}
      </p>
    </button>
  );
}

export const ReportFormModal = NiceModal.create(() => {
  const modal = useEnhancedModal();
  const t = useTranslations('reports');
  const today = new Date();

  const [mode, setMode] = useState<ReportMode>('preset');

  const form = useForm<FormValues>({
    defaultValues: {
      preset: '',
      reportType: '',
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

  const handleModeChange = (newMode: ReportMode) => {
    setMode(newMode);
    if (newMode === 'preset') {
      form.setValue('reportType', '');
    } else {
      form.setValue('preset', '');
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { preset, reportType, fechaDesde, fechaHasta, wells } =
        form.getValues();

      if (!fechaDesde || !fechaHasta) {
        throw new Error(t('export.missingDates'));
      }

      const desde = formatDateValue(fechaDesde);
      const hasta = formatDateValue(fechaHasta);

      return resolveActionResult(
        exportReport({
          reportType: (reportType as ReportType) || undefined,
          preset: (preset as PresetValue) || undefined,
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

  const presetValue = form.watch('preset');
  const reportTypeValue = form.watch('reportType');
  const hasSelection = !!presetValue || !!reportTypeValue;
  const isDisabled = !hasSelection || mutation.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={modal.handleOpenChange}>
      <DialogContent className='sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>Nuevo reporte</DialogTitle>
          <DialogDescription>
            Complete los datos para generar y descargar un reporte.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={(e) => e.preventDefault()}>
          <div className='space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <ModeCard
                selected={mode === 'preset'}
                onClick={() => handleModeChange('preset')}
                title='Usar Preset'
                description='Selecciona una configuración guardada previamente.'
              />
              <ModeCard
                selected={mode === 'specific'}
                onClick={() => handleModeChange('specific')}
                title='Reporte específico'
                description='Configura manualmente los parámetros del reporte.'
              />
            </div>

            {mode === 'preset' ? (
              <FormCombobox
                control={form.control}
                name='preset'
                label={t('fields.preset')}
                options={presetOptions}
                placeholder={t('fields.preset')}
                searchPlaceholder={t('fields.presetSearch')}
                emptyMessage={t('fields.empty')}
              />
            ) : (
              <FormCombobox
                control={form.control}
                name='reportType'
                label={t('fields.reportType')}
                options={reportTypeOptions}
                placeholder={t('fields.reportType')}
                searchPlaceholder={t('fields.reportTypeSearch')}
                emptyMessage={t('fields.empty')}
              />
            )}

            <div className='grid grid-cols-2 gap-4'>
              <FormDatePicker
                control={form.control}
                name='fechaDesde'
                label={t('fields.from')}
                config={{ placeholder: t('fields.from') }}
              />
              <FormDatePicker
                control={form.control}
                name='fechaHasta'
                label={t('fields.to')}
                config={{ placeholder: t('fields.to') }}
              />
            </div>

            <FormMultiSelect
              control={form.control}
              name='wells'
              label={t('fields.wells')}
              options={wellOptions}
              placeholder={t('fields.wellsPlaceholder')}
              searchPlaceholder={t('fields.wellsSearch')}
              isLoading={isLoadingWells}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={modal.handleClose}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                onClick={() => mutation.mutate()}
                disabled={isDisabled}
              >
                <Download className='h-4 w-4' />
                {mutation.isPending
                  ? t('export.downloading')
                  : t('export.download')}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
