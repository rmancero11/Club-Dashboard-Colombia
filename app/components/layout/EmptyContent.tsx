import { cn } from '@/app/lib/utils'
import { HTMLAttributes, ReactNode } from 'react'

export interface EmptyContentProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyContent ({ icon, title, description, className }: EmptyContentProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed', className)}>
      <div className='flex w-full flex-col items-center justify-center text-center'>
        {icon}

        <h3 className='mt-4 text-lg font-semibold'>{title}</h3>
        <p className='mb-4 mt-2 text-sm text-muted-foreground'>
          {description}
        </p>
      </div>
    </div>
  )
}
