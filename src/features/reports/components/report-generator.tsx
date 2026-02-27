'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import {
  Plus,
  ChevronDown,
  Rocket,
  FilePlus2,
  FolderArchive
} from 'lucide-react';

import { resolveActionResult } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { getWells } from '@/features/dashboards/substance/data/get-wells';
import { exportReport } from '../actions/export-report';
import {
  REPORT_TYPES,
  PRESET_OPTIONS,
  PRESET_REPORT_MAP,
  type ReportType,
  type PresetValue,
  type ExportedReportPayload
} from '../lib/types';
import { REPORT_TYPE_CONFIG } from '../lib/report-type-config';
import { ReportCard, type ReportEntry } from './report-card';

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

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `report-${Date.now()}-${nextId}`;
}

interface GlobalFiltersValues {
  fechaDesde: Date;
  fechaHasta: Date;
}

const PRESET_ZIP_PREFIX: Record<PresetValue, string> = {
  formulario_6_provincia_ba: 'Formulario6ProvinciaBA',
  datos_formulario_6_provincia_ba_cig: 'ReportesCIG'
};

function canUseFormulario6Preset(
  publicMetadata: UserPublicMetadata | undefined
): boolean {
  return (
    publicMetadata?.['reports.preset.formulario_6_provincia_ba'] === 'true'
  );
}

export function ReportGenerator() {
  const t = useTranslations('reports');
  const router = useRouter();
  const { user } = useUser();

  const form = useForm<GlobalFiltersValues>({
    defaultValues: {
      fechaDesde: new Date(),
      fechaHasta: new Date()
    }
  });

  const fechaDesde = form.watch('fechaDesde');
  const fechaHasta = form.watch('fechaHasta');

  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [zipFileName, setZipFileName] = useState('');

  const { data: wellsData = [], isLoading: isLoadingWells } = useQuery({
    queryKey: ['reports-wells'],
    queryFn: () => resolveActionResult(getWells({}))
  });

  const reportTypeOptions = REPORT_TYPES.map((value) => ({
    value,
    label: t(`types.${value}`)
  }));

  const canSeeFormulario6Preset = canUseFormulario6Preset(user?.publicMetadata);

  const visiblePresetOptions = PRESET_OPTIONS.filter(
    (option) =>
      option.value !== 'formulario_6_provincia_ba' || canSeeFormulario6Preset
  );

  const wellOptions = wellsData.map((w) => ({
    value: w.value,
    label: w.label
  }));

  function buildDefaultTitle(reportType: ReportType) {
    const prefix = REPORT_TYPE_CONFIG[reportType].titlePrefix;
    const desde = fechaDesde ? formatDateValue(fechaDesde) : '';
    const hasta = fechaHasta ? formatDateValue(fechaHasta) : '';
    return `BER_${prefix}_${desde}_${hasta}`;
  }

  function buildDefaultZipFileName(presetValue: PresetValue) {
    const prefix = PRESET_ZIP_PREFIX[presetValue];
    const desde = fechaDesde ? formatDateValue(fechaDesde) : '';
    const hasta = fechaHasta ? formatDateValue(fechaHasta) : '';
    return `BER_${prefix}_${desde}_${hasta}`;
  }

  function addReport() {
    setReports((prev) => [
      ...prev,
      { id: generateId(), title: '', reportType: '', filters: {} }
    ]);
  }

  function applyPreset(presetValue: PresetValue) {
    const reportTypes = PRESET_REPORT_MAP[presetValue] ?? [];
    const newEntries: ReportEntry[] = reportTypes.map((reportType) => {
      const config = REPORT_TYPE_CONFIG[reportType];
      const filters: Record<string, string[]> = {};
      for (const f of config.filters) {
        filters[f.key] = [];
      }
      return {
        id: generateId(),
        title: buildDefaultTitle(reportType),
        reportType,
        filters
      };
    });
    setReports((prev) => [...prev, ...newEntries]);
    setZipFileName((prev) => prev || buildDefaultZipFileName(presetValue));
  }

  function removeReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  function updateReport(id: string, changes: Partial<Omit<ReportEntry, 'id'>>) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );
  }

  const validReports = reports.filter((r) => r.reportType !== '');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!fechaDesde || !fechaHasta) {
        throw new Error(t('export.missingDates'));
      }
      if (validReports.length === 0) {
        throw new Error(t('export.missingSelection'));
      }

      const configuraciones = validReports.map((r) => ({
        nombre: r.title || buildDefaultTitle(r.reportType as ReportType),
        reporte: r.reportType as ReportType,
        pozos: r.filters['pozos'] ?? []
      }));

      return resolveActionResult(
        exportReport({
          fechaDesde: formatDateValue(fechaDesde),
          fechaHasta: formatDateValue(fechaHasta),
          nombre: zipFileName || undefined,
          configuraciones
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

  return (
    <Form
      form={form}
      onSubmit={(e) => e.preventDefault()}
      className='flex min-h-[calc(100dvh-120px)] flex-col'
    >
      <div className='flex-1 space-y-6'>
        {/* Global Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('generator.globalFilters')}</CardTitle>
            <CardDescription>
              {t('generator.globalFiltersDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col justify-between gap-6 md:flex-row md:items-end'>
              <div className='flex flex-col gap-4 sm:flex-row'>
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

              <div className='inline-flex'>
                <Button
                  type='button'
                  onClick={addReport}
                  className='rounded-r-none'
                >
                  <Plus className='h-4 w-4' />
                  {t('generator.addReport')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type='button'
                      className='rounded-l-none border-l border-white/20 px-2'
                    >
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Presets</DropdownMenuLabel>
                    {visiblePresetOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => applyPreset(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Cards */}
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            reportTypeOptions={reportTypeOptions}
            wellOptions={wellOptions}
            isLoadingWells={isLoadingWells}
            onUpdate={updateReport}
            onRemove={removeReport}
            buildDefaultTitle={buildDefaultTitle}
          />
        ))}

        {/* Empty State / Add More */}
        <button
          type='button'
          onClick={addReport}
          className='bg-muted/30 hover:bg-muted/60 group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors'
        >
          <div className='bg-muted text-muted-foreground group-hover:text-primary flex h-12 w-12 items-center justify-center rounded-full transition-colors'>
            <FilePlus2 className='h-6 w-6' />
          </div>
          <p className='text-muted-foreground group-hover:text-primary text-sm font-medium'>
            {t('generator.addMoreTitle')}
          </p>
          <p className='text-muted-foreground text-xs'>
            {t('generator.addMoreDesc')}
          </p>
        </button>
      </div>

      {/* Sticky Footer */}
      <div className='bg-card sticky bottom-0 z-40 -mx-4 mt-6 border-t px-4 py-4 sm:-mx-6 sm:px-6'>
        <div className='flex items-center gap-4'>
          <div className='hidden shrink-0 sm:block'>
            <p className='text-muted-foreground text-xs font-medium uppercase'>
              {t('generator.summary')}
            </p>
            <p className='text-primary text-sm font-bold'>
              {t('generator.filesReady', { count: validReports.length })}
            </p>
          </div>

          <Separator orientation='vertical' className='hidden h-8 sm:block' />

          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/reports')}
            disabled={mutation.isPending}
          >
            {t('generator.cancel')}
          </Button>

          <div className='relative ml-auto flex-1 sm:max-w-64'>
            <FolderArchive className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={zipFileName}
              onChange={(e) => setZipFileName(e.target.value)}
              placeholder={t('generator.zipPlaceholder')}
              className='pl-9'
            />
          </div>

          <Button
            type='button'
            onClick={() => mutation.mutate()}
            disabled={
              validReports.length === 0 ||
              !fechaDesde ||
              !fechaHasta ||
              mutation.isPending
            }
          >
            {mutation.isPending
              ? t('export.downloading')
              : t('generator.generateAll')}
            <Rocket className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </div>
    </Form>
  );
}
