import { Card, CardContent, CardTitle, CardHeader } from '@/app/components/ui/Card'
import { cn } from '@/app/lib/utils'
import { HTMLAttributes } from 'react'
import { Business } from '@/app/types/business'
import { useGetAverageScore } from '@/app/hooks/useGetAverageScore'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { Slider } from '@/app/components/ui/Slider'
import { Ratings } from '@/app/types/feedback'
import { DateRange, Preset } from '@/app/types/general'

import Image from 'next/image'
import SatisfactionScale from './SatisfactionScale'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { format, isSameDay } from 'date-fns'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'
import { useSearchParams } from 'next/navigation'

type INegativeFeedbackPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function SatisfactionRating ({ businessData, className, preset, dateRange }: INegativeFeedbackPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const { allFeedbacksAverageScore, allFeedBacksCount } = useGetAverageScore({ businessData, dateRange })
  const formattedAverageScore = allFeedbacksAverageScore.toFixed(1)

  const searchParams = useSearchParams()
  const branch = searchParams.get('sucursal')
  const hasBranch = branch !== 'todas'
  const branchName = hasBranch ? businessData?.name : 'la marca'

  const hasPreset = preset !== undefined
  const { from, to = new Date() } = dateRange
  const isSameRangeDate = isSameDay(new Date(from), new Date(to))
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy')
  const formattedToDate = format(new Date(to), 'MMM dd yyyy')
  const customRangeDate = isSameRangeDate ? `${formattedFromDate}` : `${formattedFromDate} - ${formattedToDate}`
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate

  const currentMonth = getCurrentMonth()

  const subtitle = queryRangeDate || `${capitalizeFirstLetter(currentMonth)} ${new Date().getFullYear()}`

  return (
    <Card className={cn(className, 'flex flex-col items-center')}>
      <CardHeader className='pb-4'>
        <CardTitle className='text-sm font-medium'>
          Calificación promedio total de {branchName} ({subtitle})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-center space-x-2'>
          <div className='text-2xl font-bold flex items-center gap-1'>{formattedAverageScore} <StarFilledIcon className='inline-block text-amber-300 w-6 h-auto' /> ({allFeedBacksCount}) </div>
        </div>
        <SatisfactionScale allFeedbacksAverageScore={allFeedbacksAverageScore} />
      </CardContent>
    </Card>
  )
}

export default SatisfactionRating
