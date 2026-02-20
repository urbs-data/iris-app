'use client';

import NiceModal from '@ebay/nice-modal-react';
import { Button } from '@/components/ui/button';
import { ReportFormModal } from './report-form-modal';

export function NewReportButton() {
  const handleOpenNewReport = () => {
    NiceModal.show(ReportFormModal);
  };

  return <Button onClick={handleOpenNewReport}>Nuevo reporte</Button>;
}
