import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { Business } from '@/app/types/business'
import { DateRange, Preset } from '@/app/types/general'
import { HTMLAttributes } from 'react'

import { negativeFeedbackAdapter } from '@/app/adapters/negativeFeedback.adapter'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'

import { format, isSameDay } from 'date-fns'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import dynamic from 'next/dynamic'

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type INegativeFeedbackPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function NegativeFeedbackPieChart ({ businessData, dateRange, preset, className }: INegativeFeedbackPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const adaptedNegativeFeedback = negativeFeedbackAdapter(businessData, dateRange)

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
            text: `Áreas de Mejora (${subtitle})`,
            left: 'center',
            textStyle: {
              overflow: 'break'
            }
          },
          grid: {
            right: '20%',
            left: '20%'
          },
          tooltip: {
            trigger: 'item'
          },
          legend: {
            top: '12%',
            left: 'center'
          },
          series: [
            {
              name: 'Área de Mejora',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              top: '12%',
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
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
              data: adaptedNegativeFeedback
            }
          ]
        }}
      />
    </Card>
  )
}

export default NegativeFeedbackPieChart
