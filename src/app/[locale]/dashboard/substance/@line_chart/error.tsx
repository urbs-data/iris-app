'use client';

import { Card } from '@/components/ui/card';

export default function Error() {
  return (
    <Card className='flex h-full items-center justify-center p-4'>
      <p className='text-muted-foreground text-sm'>
        Error al cargar el gráfico. Intente nuevamente.
      </p>
    </Card>
  );
}
