'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className='flex h-full items-center justify-center p-4'>
      <Card className='flex flex-col items-center gap-4 p-6'>
        <h2 className='text-lg font-semibold'>Algo salió mal</h2>
        <p className='text-muted-foreground text-sm'>
          Error al cargar el tablero de sustancias.
        </p>
        <Button onClick={reset}>Intentar de nuevo</Button>
      </Card>
    </div>
  );
}
