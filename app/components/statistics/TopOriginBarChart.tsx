import { Card } from '../ui/Card'
import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { cn } from '@/app/lib/utils'
import { Business } from '@/app/types/business'
import { DateRange, Preset } from '@/app/types/general'
import { format, isSameDay } from 'date-fns'
import { HTMLAttributes } from 'react'

import { originDataAdapter } from '@/app/adapters/originData.adapter'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import dynamic from 'next/dynamic'

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type ITopOriginBarChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function TopOriginBarChart ({ businessData, dateRange, preset, className }: ITopOriginBarChartProps & HTMLAttributes<HTMLDivElement>) {
  const adaptedOriginData = originDataAdapter(businessData, dateRange)
  const lagendValues = adaptedOriginData.map(data => data.name)

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
    <Card className={cn('py-8', className)}>
      <ReactEcharts
        option={{
          title: {
            text: `Top origen (${subtitle})`,
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            top: '12%',
            left: 'center',
            data: lagendValues
          },
          series: [
            {
              name: 'Origen',
              type: 'pie',
              selectedMode: 'single',
              top: '40%',
              radius: ['40%', '90%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 18,
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: adaptedOriginData
            }
          ]
        }}
      />
    </Card>
  )
}

export default TopOriginBarChart
