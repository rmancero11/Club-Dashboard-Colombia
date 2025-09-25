import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { Business } from '@/app/types/business'
import { DateRange, Preset } from '@/app/types/general'
import { HTMLAttributes } from 'react'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'

import { format, isSameDay } from 'date-fns'

import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import { simpleRatingAdapter } from '@/app/adapters/simpleRatingAdapter'

import dynamic from 'next/dynamic'

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type ISimpleRatingPieChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function SimpleRatingPieChart ({ businessData, dateRange, preset, className }: ISimpleRatingPieChartProps & HTMLAttributes<HTMLDivElement>) {
  const adaptedSimpleRating = simpleRatingAdapter(businessData, dateRange)
  const isDsc = businessData?.parentId === 'dsc-solutions'
  return (
    <Card className={cn('py-8', className)}>
      <ReactEcharts
        option={{
          color: ['#FF2442', '#FF7927', '#0CB852', '#8AC73E'],
          title: {
            text: `${isDsc ? 'Total surveys' : 'Total encuestas'} (${preset?.label})`,
            left: 'center',
            textStyle: {
              overflow: 'break'
            }
          },
          grid: {
            right: '10%',
            left: '10%'
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
              name: 'Rating general',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              top: '12%',
              label: {
                position: 'outer',
                formatter: ' {per|{d}%} ({c}) ',
                backgroundColor: '#FFFF',
                color: '#4C5058',
                fontSize: 14,
                fontWeight: 'bold',
                borderWidth: 1,
                borderRadius: 4,
                padding: [2, 4],
                rich: {
                  hr: {
                    width: '100%',
                    borderWidth: 1,
                    height: 0
                  },
                  b: {
                    color: '#4C5058',
                    fontSize: 14,
                    fontWeight: 'bold',
                    lineHeight: 33
                  },
                  per: {
                    color: '#606381',
                    fontSize: 14,
                    fontWeight: 'bold',
                    padding: [8, 4],
                    borderRadius: 4
                  }
                }
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
              data: adaptedSimpleRating
            }
          ]
        }}
      />
    </Card>
  )
}

export default SimpleRatingPieChart
