'use client'

import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { Business } from '@/app/types/business'
import { DateRange, Preset } from '@/app/types/general'
import { HTMLAttributes } from 'react'
import useGetRoiOriginChartData from '@/app/hooks/useGetRoiOriginChartData'
import { Origins } from '@/app/types/feedback'

import dynamic from 'next/dynamic'

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IRoiByOriginChartProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset?: Preset | undefined
}

function RoiByOriginChart ({ businessData, dateRange, className, preset }: IRoiByOriginChartProps & HTMLAttributes<HTMLDivElement>) {
  const { roiPerOrigin } = useGetRoiOriginChartData(businessData, dateRange)
  type FilteredOrigins = Omit<Origins, 'Referred' | 'New client' | 'Nouvelle cliente' | 'Référé'>
  const origins = Object.keys(roiPerOrigin) as unknown as FilteredOrigins[]

  const hasPreset = preset !== undefined
  const presetLabel = hasPreset ? `(${preset?.label})` : ''

  const originColors = {
    Maps: '#FFC107',
    TikTok: '#FF5722',
    Facebook: '#3F51B5',
    WhatsApp: '#4CAF50',
    Instagram: '#E91E63',
    Referido: '#9C27B0',
    'Cliente nuevo': '#2196F3'
  }

  const seriesData = Object.values(roiPerOrigin) as unknown as number[]
  return (
    <Card className={cn('py-8', className)}>
      <ReactEcharts
        option={{
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            show: true
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          yAxis: {
            type: 'category',
            data: origins
          },
          xAxis: {
            type: 'value'
          },
          series: [
            {
              name: `Ingresos aproximados por canal ${presetLabel}`,
              data: seriesData,
              type: 'bar',
              itemStyle: {
                color: (param: { name: string }) => {
                  return originColors[param.name as keyof typeof originColors] || '#5470c6'
                }
              }
            }
          ],
          toolbox: {
            show: true,
            feature: {
              dataView: {},
              saveAsImage: {}
            }
          }
        }}
      />
    </Card>
  )
}

export default RoiByOriginChart
