'use client';

import { FileText, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardAction
} from '@/components/ui/card';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  MultiSelect,
  type MultiSelectOption
} from '@/components/ui/multi-select';
import { REPORT_TYPE_CONFIG } from '../lib/report-type-config';
import type { ReportType } from '../lib/types';

export interface ReportEntry {
  id: string;
  title: string;
  reportType: ReportType | '';
  filters: Record<string, string[]>;
}

interface ReportCardProps {
  report: ReportEntry;
  reportTypeOptions: ComboboxOption[];
  wellOptions: MultiSelectOption[];
  isLoadingWells: boolean;
  onUpdate: (id: string, changes: Partial<Omit<ReportEntry, 'id'>>) => void;
  onRemove: (id: string) => void;
  buildDefaultTitle: (reportType: ReportType) => string;
}

export function ReportCard({
  report,
  reportTypeOptions,
  wellOptions,
  isLoadingWells,
  onUpdate,
  onRemove,
  buildDefaultTitle
}: ReportCardProps) {
  const t = useTranslations('reports');

  const config = report.reportType
    ? REPORT_TYPE_CONFIG[report.reportType]
    : null;

  const filterFields = config?.filters ?? [];
  const Icon = config?.icon ?? FileText;

  return (
    <Card>
      <CardHeader className='border-b pb-4!'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 text-primary shrink-0 rounded-lg p-2'>
            <Icon className='h-5 w-5' />
          </div>
          <Input
            value={report.title}
            onChange={(e) => onUpdate(report.id, { title: e.target.value })}
            placeholder={t('generator.reportTitlePlaceholder')}
            className='h-auto border-none bg-transparent p-0 text-lg font-semibold shadow-none focus-visible:ring-0'
          />
        </div>
        <CardAction>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-destructive'
            onClick={() => onRemove(report.id)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-12'>
          <div className='space-y-2 md:col-span-4'>
            <Label>{t('generator.reportTypeLabel')}</Label>
            <Combobox
              value={report.reportType || null}
              onValueChange={(value) => {
                const newType = (value ?? '') as ReportType | '';
                const newFilters: Record<string, string[]> = {};
                if (newType) {
                  for (const f of REPORT_TYPE_CONFIG[newType].filters) {
                    newFilters[f.key] = [];
                  }
                }
                onUpdate(report.id, {
                  reportType: newType,
                  filters: newFilters,
                  title: newType ? buildDefaultTitle(newType) : ''
                });
              }}
              options={reportTypeOptions}
              placeholder={t('fields.reportType')}
              searchPlaceholder={t('fields.reportTypeSearch')}
              emptyMessage={t('fields.empty')}
            />
          </div>

          <div className='space-y-2 md:col-span-8'>
            <Label>{t('generator.specificFiltersLabel')}</Label>
            {filterFields.length > 0 ? (
              filterFields.map((field) => (
                <div key={field.key}>
                  {field.type === 'wells' && (
                    <MultiSelect
                      values={report.filters[field.key] ?? []}
                      onValuesChange={(values) =>
                        onUpdate(report.id, {
                          filters: { ...report.filters, [field.key]: values }
                        })
                      }
                      options={wellOptions}
                      placeholder={t('fields.wellsPlaceholder')}
                      searchPlaceholder={t('fields.wellsSearch')}
                      isLoading={isLoadingWells}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className='text-muted-foreground py-2 text-sm'>
                {t('generator.selectTypeFirst')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
