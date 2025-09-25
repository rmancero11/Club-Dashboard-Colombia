import { HTMLAttributes } from 'react'

import { cn } from '@/app/lib/utils'
import { Badge } from '../ui/Badge'
import { Business } from '@/app/types/business'
import useGetVisitorCount from '@/app/hooks/useGetVisitorCount'
import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'
import CardWidget from '../ui/CardWidget'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons'

import { DateRange, Preset } from '@/app/types/general'

import { format, isSameDay } from 'date-fns'

import { PAST_PRESETS } from '@/app/constants/dates'

type INegativeFeedbackPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function CurrentMonthVisitorsChart ({ businessData, className, dateRange, preset }: INegativeFeedbackPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const { currentPeriodFeedbacksCount, diff, diffPercentage, lastPeriodFeedbacksCount, isPositive } = useGetVisitorCount({ businessData, dateRange })

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
    <CardWidget
      className={cn(className)} title='Total visitas'
      subtitle={subtitle}
      icon={<FontAwesomeIcon icon={faArrowTrendUp} className='h-4 w-4 text-muted-foreground' />}
    >
      <div className='flex items-center space-x-2'>
        <div className='text-2xl font-bold'>✨ {currentPeriodFeedbacksCount}</div>
        <Badge variant={isPositive ? 'success' : 'destructive'}> {diffPercentage.toFixed(0)}%</Badge>
      </div>
      <p className='text-xs text-muted-foreground'>
        {isPositive ? '+' : ''} {diff} respecto {PAST_PRESETS[subtitle] || 'al mismo periodo anterior'}  ( {lastPeriodFeedbacksCount} )
      </p>
    </CardWidget>
  )
}

export default CurrentMonthVisitorsChart
