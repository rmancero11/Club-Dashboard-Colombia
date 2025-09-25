import { Card, CardContent, CardTitle, CardHeader } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { HTMLAttributes } from 'react'
import { Badge } from '../ui/Badge'
import { Business } from '@/app/types/business'
import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'
import { useGetAverageScore } from '@/app/hooks/useGetAverageScore'
import { RocketIcon } from '@radix-ui/react-icons'

import { DateRange, Preset } from '@/app/types/general'

import { format, isSameDay } from 'date-fns'

import { PAST_PRESETS } from '@/app/constants/dates'

type INegativeFeedbackPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function CurrentMonthAverageScoreChart ({ businessData, className, dateRange, preset }: INegativeFeedbackPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const { currentPeriodAverageScore, diff, diffPercentage, lastPeriodAverageScore, isPositive } = useGetAverageScore({ businessData, dateRange })
  const currentMonth = getCurrentMonth()

  const hasPreset = preset !== undefined
  const { from, to = new Date() } = dateRange
  const isSameRangeDate = isSameDay(new Date(from), new Date(to))
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy')
  const formattedToDate = format(new Date(to), 'MMM dd yyyy')
  const customRangeDate = isSameRangeDate ? `${formattedFromDate}` : `${formattedFromDate} - ${formattedToDate}`
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate

  const subtitle = queryRangeDate || `${capitalizeFirstLetter(currentMonth)} ${new Date().getFullYear()}`

  return (
    <Card className={cn(className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>
          Calificación promedio
        </CardTitle>
        <div className=''>
          <RocketIcon className='h-4 w-4 text-muted-foreground' />
          {subtitle}
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center space-x-2'>
          <div className='text-2xl font-bold'>✨ {currentPeriodAverageScore} / 5</div>
          <Badge variant={isPositive ? 'success' : 'destructive'}> {diffPercentage}%</Badge>
        </div>
        <p className='text-xs text-muted-foreground'>
          {isPositive ? '+' : ''} {diff} respecto {PAST_PRESETS[subtitle] || 'al mismo periodo anterior'} ( {lastPeriodAverageScore} )
        </p>
      </CardContent>
    </Card>
  )
}

export default CurrentMonthAverageScoreChart
