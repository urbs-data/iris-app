'use client';

import Link from 'next/link';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import { serialize } from '../searchparams';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

interface FileBreadcrumbsProps {
  currentPath: string;
}

export function FileBreadcrumbs({ currentPath }: FileBreadcrumbsProps) {
  const pathParts = currentPath.split('/').filter(Boolean);

  const buildPath = (index: number) => {
    if (index === -1) return '/';
    return '/' + pathParts.slice(0, index + 1).join('/');
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home/Root */}
        {pathParts.length === 0 ? (
          <BreadcrumbItem>
            <BreadcrumbPage>
              <IconHome className='h-4 w-4' />
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/dashboard/explorer${serialize({ path: '/' })}`}>
                  <IconHome className='h-4 w-4' />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <IconChevronRight className='h-4 w-4' />
            </BreadcrumbSeparator>
          </>
        )}

        {/* Path parts */}
        {pathParts.map((part, index) => {
          const isLast = index === pathParts.length - 1;
          const path = buildPath(index);

          return (
            <div key={path} className='flex items-center gap-2'>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={`/dashboard/explorer${serialize({ path })}`}>
                      {part}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <IconChevronRight className='h-4 w-4' />
                </BreadcrumbSeparator>
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
