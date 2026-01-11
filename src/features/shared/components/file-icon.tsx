'use client';

import {
  IconFolder,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypeXls,
  IconPhoto,
  IconFileZip,
  IconFileText
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  filename: string;
  type?: 'file' | 'folder';
  className?: string;
}

export function FileIcon({
  filename,
  type = 'file',
  className
}: FileIconProps) {
  if (type === 'folder') {
    return <IconFolder className={cn('h-5 w-5 text-blue-500', className)} />;
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return (
        <IconFileTypePdf className={cn('h-5 w-5 text-red-500', className)} />
      );
    case 'doc':
    case 'docx':
      return (
        <IconFileTypeDocx className={cn('h-5 w-5 text-blue-600', className)} />
      );
    case 'xls':
    case 'xlsx':
      return (
        <IconFileTypeXls className={cn('h-5 w-5 text-green-600', className)} />
      );
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <IconPhoto className={cn('h-5 w-5 text-purple-500', className)} />;
    case 'zip':
    case 'rar':
    case '7z':
      return (
        <IconFileZip className={cn('h-5 w-5 text-amber-500', className)} />
      );
    case 'txt':
    case 'csv':
      return (
        <IconFileText className={cn('h-5 w-5 text-gray-500', className)} />
      );
    default:
      return <IconFile className={cn('h-5 w-5 text-gray-500', className)} />;
  }
}
