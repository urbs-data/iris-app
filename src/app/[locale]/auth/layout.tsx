import { cn } from '@/lib/utils';
import { InteractiveGridPattern } from '@/features/auth/components/interactive-grid';
import { LangSwitcher } from '@/components/layout/lang-switcher';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useTranslations } from 'next-intl';

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
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
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
