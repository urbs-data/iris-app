'use client';

import { Check, AlertTriangle, X, HelpCircle, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type ValidationStatus = 'SUCCESS' | 'WARNING' | 'ERROR' | 'SKIPPED';

interface StatusConfig {
  labelKey: string;
  icon: LucideIcon;
  color: string;
  border: string;
  tabColor: string;
}

export const statusConfig: Record<ValidationStatus, StatusConfig> = {
  SUCCESS: {
    labelKey: 'results.success',
    icon: Check,
    color: 'bg-green-100 text-green-800',
    border: 'border-green-200',
    tabColor: 'bg-green-600'
  },
  WARNING: {
    labelKey: 'results.warning',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800',
    border: 'border-yellow-200',
    tabColor: 'bg-yellow-600'
  },
  ERROR: {
    labelKey: 'results.error',
    icon: X,
    color: 'bg-red-100 text-red-800',
    border: 'border-red-200',
    tabColor: 'bg-red-600'
  },
  SKIPPED: {
    labelKey: 'results.skipped',
    icon: HelpCircle,
    color: 'bg-slate-100 text-slate-800',
    border: 'border-slate-200',
    tabColor: 'bg-slate-600 '
  }
};

interface StatusBadgeProps {
  status: ValidationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('validation');
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center rounded px-2 py-1 ${config.color}`}>
      <Icon className='mr-1 h-4 w-4' />
      <span>{t(config.labelKey)}</span>
    </div>
  );
}
