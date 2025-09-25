import React, { ReactNode } from 'react'
import { Card, CardContent, CardTitle, CardHeader } from './Card'
import { cn } from '@/app/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ToolTip'
import { IconInfoCircle } from '@tabler/icons-react'
import { cva, type VariantProps } from 'class-variance-authority'

const cardOptions = {
  default:
    'hover:bg-gray-100/50',
  secondary:
    'bg-primary shadow hover:bg-primary/90',
    gold: 'border-gold shadow',
    silver: 'border-silver shadow',
    bronze: 'border-bronze shadow'
}

const cardWidgetVariants = cva(
  '',
  {
    variants: {
      variant: cardOptions
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface ICardWidget
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardWidgetVariants> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  tooltipContent?: string;
}

function CardWidget ({ title, subtitle, icon, children, className, tooltipContent, variant }: ICardWidget) {
  return (
    <Card className={cn(cardWidgetVariants({ variant, className }))}>
      <CardHeader className='flex relative flex-row items-center justify-between space-y-0 pb-2'>
        {tooltipContent && (
        <div className='absolute right-2 top-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconInfoCircle className='h-4 w-4' />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        )}
        {title && <CardTitle>{title}</CardTitle>}
        <div>
          {icon && <div> {icon} </div>}
          {subtitle && <div className='text-xs'> {subtitle}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default CardWidget
