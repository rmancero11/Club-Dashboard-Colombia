import { HTMLAttributes, useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { DateRange, Preset } from '@/app/types/general'
import { Business,  Waiter } from '@/app/types/business'

import dynamic from 'next/dynamic'
import { getAllWaitersDataPerPeriod, getTotalWaitersDataPerPeriod } from '@/app/helpers';
import { RATINGS } from '@/app/constants/general';
import { useSearchParams } from 'next/navigation';

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IVisistsPerDateProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function TabletsComparative({ businessData, dateRange, preset, className }: IVisistsPerDateProps & HTMLAttributes<HTMLDivElement>) {
  const [waitersData, setWaitersData] = useState<Waiter[] | null>()
  const isDsc = businessData?.parentId === 'dsc-solutions'
  const searchParams = useSearchParams()
  const branch = searchParams.get('sucursal')
  useEffect(() => {
    const waiters =
      branch !== 'todas'
        ? getAllWaitersDataPerPeriod(businessData, dateRange)
        : getTotalWaitersDataPerPeriod(businessData, dateRange)
    setWaitersData(waiters)
  }, [branch, businessData, dateRange])

  const uniquesTabletsArray = Array.from(new Set(waitersData?.map(waiter => waiter.name) || []))
  let option;

  const formatData = (data: Waiter[] | null | undefined) => {
    return data?.map(waiter => {
      const formattedFeedbacks = Object.keys(RATINGS).map(key => {
        return waiter.numberOfFeedbackPerRating[Number(key)] || 0;
      });

      return formattedFeedbacks
    })
  }

  const chartData = formatData(waitersData);

  const sumFeedbacks = (feedbacks: number[]) => {
    return feedbacks.reduce((acc, num) => acc + num, 0);
  }

  const grid = {
    left: '3%',
    right: '4%',
    bottom: '1%',
    containLabel: true
  };

  const series = [
    'Bad',
    'Regular',
    'Good',
    'Excellent',
  ].map((name, sid) => {
    return {
      name,
      type: 'bar',
      stack: 'total',
      barWidth: '96%',
      itemStyle: {
        normal: {
          borderWidth: 2,
          borderColor: 'rgba(0,0,0,0)',
          borderRadius: [0, 0, 0, 0], // Ajusta el radio de los bordes de la barra si lo deseas
        }
      },
      label: {
        show: true,
        formatter: (params: { value: number; dataIndex: number }) => {
          const value = params.value;
          const dataIndex = params.dataIndex;
          const totalFeedbacks = sumFeedbacks(chartData && chartData[dataIndex] || [0]);
          if (value === 0) {
            return '';
          }
          const percentage = Math.round(value * 100 / totalFeedbacks);
          return percentage + '%';
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: chartData?.map((arr) => arr[sid])
    };
  });
  option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    title: {
      text: `${isDsc ? 'Comparatives' : 'Comparativas'} (${preset?.label})`,
      left: 'center',
      textStyle: {
        overflow: 'break'
      }
    },
    color: ['#FF2442', '#FF7927', '#0CB852', '#8AC73E'],
    legend: {
      top: '12%',
      selectedMode: false,
    },
    grid,
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: uniquesTabletsArray,
      nameTextStyle: {
        fontSize: 8
      }
    },
    series,
  };
  return (
    <Card className={cn('pt-8', className)}>
      <ReactEcharts
        option={option}
      />
    </Card>
  )
}

export default TabletsComparative
