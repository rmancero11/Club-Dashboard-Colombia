import { cn } from '@/app/lib/utils'
import { HTMLAttributes } from 'react'
import { Business } from '@/app/types/business'
import { useGetAverageScore } from '@/app/hooks/useGetAverageScore'
import { DateRange, Preset } from '@/app/types/general'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { format, isSameDay } from 'date-fns'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'
import RatingScale from './RatingScale'

type INegativeFeedbackPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function SimpleSatisfactionRating ({ businessData, className, preset, dateRange }: INegativeFeedbackPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const { allFeedBacksCount, lastPeriodAverageScore, currentPeriodAverageScore, diff, isPositive } = useGetAverageScore({ businessData, dateRange })
  const isDsc = businessData?.parentId === 'dsc-solutions'

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
    <div className={cn(className)}>
      <h2 className='text-3xl font-extrabold text-black text-center'>
        {isDsc ? 'Total results' : 'Resultados totales'}
      </h2>
      <RatingScale
        isDsc={isDsc}
        currentPeriodAverageScore={currentPeriodAverageScore}
        diff={diff}
        isPositive={isPositive}
        lastPeriodAverageScore={lastPeriodAverageScore}
        subtitle={subtitle}
        allFeedBacksCount={allFeedBacksCount}
      />
    </div>
  )
}

export default SimpleSatisfactionRating
