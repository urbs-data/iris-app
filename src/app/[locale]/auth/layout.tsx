import { cn } from '@/lib/utils';
import { InteractiveGridPattern } from '@/features/auth/components/interactive-grid';
import { LangSwitcher } from '@/components/layout/lang-switcher';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('auth');
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Theme and Language Switchers */}
      <div className='absolute top-4 right-4 z-50 flex items-center gap-2'>
        <LangSwitcher />
        <ModeToggle />
      </div>

      {/* Left Panel - Logo and Grid Pattern */}
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <Image
            src='/logo_byontek_blanco.png'
            alt='Byontek Logo'
            width={120}
            height={120}
            className='h-auto w-auto'
            priority
          />
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
      </div>

      {/* Right Panel - Content */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {children}
          <p className='text-muted-foreground px-8 text-center text-sm'>
            {t.rich('termsAndPrivacy', {
              terms: (chunks) => (
                <a
                  href='https://www.corteva.com/terms-and-conditions.html'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-primary underline underline-offset-4'
                >
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a
                  href='https://www.corteva.com/privacy.html'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-primary underline underline-offset-4'
                >
                  {chunks}
                </a>
              )
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
