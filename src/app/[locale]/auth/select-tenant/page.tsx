import { TenantSelector } from '@/features/tenant/components/tenant-selector';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('auth.tenant.selectProject');

export default function SelectTenantPage() {
  return <TenantSelector />;
}
