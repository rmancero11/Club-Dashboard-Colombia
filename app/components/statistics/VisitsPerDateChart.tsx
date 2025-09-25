import { HTMLAttributes } from 'react'

import { visitsPerDateAdapter } from '@/app/adapters/visitsPerDateAdapter.adapter'

import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import { DateRange, Preset } from '@/app/types/general'
import { format, isSameDay } from 'date-fns'
import { Business } from '@/app/types/business'
import { getCurrentMonth } from '@/app/helpers/dates.helpers'

import dynamic from 'next/dynamic'

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IVisistsPerDateProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function VisitsPerDateChart ({ businessData, dateRange, preset, className }: IVisistsPerDateProps & HTMLAttributes<HTMLDivElement>) {
  const adaptedVisitsPerDate = visitsPerDateAdapter(businessData, dateRange)
  const data = adaptedVisitsPerDate.map(visit => visit.name)

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
    <Card className={cn('pt-8', className)}>
      <ReactEcharts
        option={{
          tooltip: {
            trigger: 'axis',
            position: function (pt: any[]) {
              return [pt[0], '10%']
            }
          },
          title: {
            left: 'center',
            text: `Total de visitas (${subtitle})`
          },
          toolbox: {
            feature: {
              dataZoom: {
                yAxisIndex: 'none'
              },
              restore: {
                top: '8%',
                right: '6%'
              },
              saveAsImage: {}
            },
            top: '8%',
            right: '6%'
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data
          },
          yAxis: {
            type: 'value',
            boundaryGap: [0, '100%']
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 10
            },
            {
              start: 0,
              end: 10
            }
          ],
          series: [
            {
              name: 'Número de visitas',
              type: 'line',
              symbol: 'none',
              sampling: 'lttb',
              itemStyle: {
                color: 'rgb(255, 70, 131)'
              },
              areaStyle: {
                color: 'rgb(255, 158, 68)'
              },
              data: adaptedVisitsPerDate
            }
          ]
        }}
      />
    </Card>
  )
}

export default VisitsPerDateChart
