'use client';

import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface RelevanceStarsProps {
  score?: number;
  maxStars?: number;
  className?: string;
}

export function RelevanceStars({
  score = 0,
  maxStars = 3,
  className
}: RelevanceStarsProps) {
  const starCount = Math.min(
    maxStars,
    Math.max(1, Math.round(1 + (score / 15) * 2))
  );

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const isFilled = i < starCount;
        return isFilled ? (
          <IconStarFilled key={i} className='h-4 w-4 text-yellow-500' />
        ) : (
          <IconStar key={i} className='h-4 w-4 text-gray-300' />
        );
      })}
    </div>
  );
}
