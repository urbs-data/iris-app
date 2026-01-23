'use client';

import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { LangSwitcher } from './lang-switcher';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function Header() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <Image
          src={isDark ? '/logo_byontek_blanco.png' : '/logo_byontek.png'}
          alt='Byontek Logo'
          width={80}
          height={40}
          className='h-auto w-auto'
          priority
        />
        <LangSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
