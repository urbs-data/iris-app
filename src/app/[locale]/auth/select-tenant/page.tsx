import { Metadata } from 'next';
import { TenantSelector } from '@/features/tenant/components/tenant-selector';

export const metadata: Metadata = {
  title: 'Seleccionar Proyecto',
  description: 'Selecciona el proyecto para continuar.'
};

export default function SelectTenantPage() {
  return <TenantSelector />;
}
