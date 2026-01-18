'use client';

import { useTranslations } from 'next-intl';
import { Check, AlertTriangle, X, HelpCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { FileText } from 'lucide-react';
import { ValidationStatus, statusConfig } from './status-badge';
import { ValidationItem } from './validation-item';
import { NoResults } from './no-results';
import { ValidationResultData } from '../lib/models';

interface StatusCounts {
  SUCCESS: number;
  WARNING: number;
  ERROR: number;
  SKIPPED: number;
}

interface ValidationTabsProps {
  statusCounts: StatusCounts;
  selectedTab: ValidationStatus;
  onTabChange: (tab: ValidationStatus) => void;
  groupedResults: Record<string, ValidationResultData[]>;
}

const TAB_ORDER: ValidationStatus[] = [
  'ERROR',
  'WARNING',
  'SUCCESS',
  'SKIPPED'
];

const TAB_ICONS = {
  ERROR: X,
  WARNING: AlertTriangle,
  SUCCESS: Check,
  SKIPPED: HelpCircle
};

const TAB_ICON_COLORS = {
  ERROR: 'text-red-600',
  WARNING: 'text-yellow-600',
  SUCCESS: 'text-green-600',
  SKIPPED: 'text-slate-600'
};

export function ValidationTabs({
  statusCounts,
  selectedTab,
  onTabChange,
  groupedResults
}: ValidationTabsProps) {
  const t = useTranslations('validation');

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => onTabChange(value as ValidationStatus)}
      className='w-full'
    >
      <TabsList className='mb-6 grid grid-cols-4'>
        {TAB_ORDER.map((status) => {
          const Icon = TAB_ICONS[status];
          const iconColor = TAB_ICON_COLORS[status];
          const isSelected = selectedTab === status;

          return (
            <TabsTrigger
              key={status}
              value={status}
              className={`transition-all duration-200 ease-in-out ${isSelected ? statusConfig[status].tabColor : ''}`}
            >
              <Icon className={`mr-1 h-4 w-4 ${iconColor}`} />
              {t(statusConfig[status].labelKey)} ({statusCounts[status]})
            </TabsTrigger>
          );
        })}
      </TabsList>

      {TAB_ORDER.map((status) => {
        const hasResults = Object.keys(groupedResults).length > 0;

        return (
          <TabsContent key={status} value={status} className='mt-0'>
            {hasResults ? (
              <div className='animate-in fade-in-50 space-y-6 duration-300'>
                {Object.entries(groupedResults).map(([archivo, results]) => (
                  <div key={archivo} className='space-y-3'>
                    <div className='flex items-center space-x-2 text-blue-700'>
                      <FileText className='h-4 w-4' />
                      <h3 className='font-mono text-sm font-medium'>
                        {archivo}
                      </h3>
                    </div>
                    <Accordion type='single' collapsible className='w-full'>
                      {results.map((result, idx) => (
                        <ValidationItem
                          key={`${result.codigo}-${idx}`}
                          result={result}
                          index={idx}
                        />
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            ) : (
              <div className='animate-in fade-in-50 duration-300'>
                <NoResults status={status} />
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
