import { HTMLAttributes } from 'react'
import { Card } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { DateRange, Preset } from '@/app/types/general'
import { Business, Feedback } from '@/app/types/business'
import dynamic from 'next/dynamic'
import { getDateFromFeedback, getFeedacksByPeriod } from '@/app/helpers';
import { RATINGS } from '@/app/constants/general';

const ReactEcharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IVisistsPerDateProps = {
  businessData: Business | null | undefined
  dateRange: DateRange
  preset: Preset | undefined
}

function ResultsWeeklyDistribution({ businessData, dateRange, preset, className }: IVisistsPerDateProps & HTMLAttributes<HTMLDivElement>) {
  const feedbacksByDate = getFeedacksByPeriod(businessData?.feedbacks || [], dateRange)
  const isDsc = businessData?.parentId === 'dsc-solutions'
  const uniqueDatesSet = new Set<string>();

  const feedbacks = feedbacksByDate.map(feedback => {
    const date = getDateFromFeedback(feedback)

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    const formattedDate: string = date.toLocaleDateString(isDsc ? 'en' : 'es-EC', options)
    if (!uniqueDatesSet.has(formattedDate)) {
      uniqueDatesSet.add(formattedDate); // Agrega la fecha al conjunto
    }
    return {
      Rating: (feedback as Feedback).Rating,
      CreationDate: formattedDate,
    }
  });

  const uniqueDatesArray = Array.from(uniqueDatesSet);

  const averageFeedbacksByRating = feedbacks.reduce((acc: { [key: string]: number[] }, feedback) => {
    const { Rating, CreationDate } = feedback;
    const dayIndex = uniqueDatesArray.indexOf(CreationDate);
    const ratingOptions = RATINGS[Rating as keyof typeof RATINGS];
    if (!acc[ratingOptions]) {
      acc[ratingOptions] = Array(uniqueDatesArray.length).fill(0);
    }
    acc[ratingOptions][dayIndex] += Rating;
    return acc;
  }, {});

  const data = Object.values(RATINGS).map((rating) => {
    return averageFeedbacksByRating[rating] || Array(uniqueDatesArray.length).fill(0);
  });

  let option;
  const totalData: number[] = [];
  for (let i = 0; i < data[0].length; ++i) {
    let sum = 0;
    for (let j = 0; j < data.length; ++j) {
      sum += data[j][i];
    }
    totalData.push(sum);
  }
  const grid = {
    left: 100,
    right: 100,
    top: 75,
    bottom: 50
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
      barWidth: '60%',
      label: {
        show: true,
        formatter: (params: { value: number; }) => {
          if (params.value === 0) {
            return '';
          }
          return Math.round(params.value * 1000 / 10) + '%'
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: data[sid].map((d, did) =>
        totalData[did] <= 0 ? 0 : Number((d / totalData[did]).toFixed(3))
      ),
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
      text: `${isDsc ? 'Results' : 'Resultados'} (${preset?.label})`,
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
    yAxis: {
      type: 'value'
    },
    xAxis: {
      type: 'category',
      data: uniqueDatesArray
    },
    series: [
      ...series,
    ]
  };

  for (let i = 0; i < data[0].length; ++i) {
    let sum = 0;
    for (let j = 0; j < data.length; ++j) {
      sum += data[j][i];
    }
    totalData.push(sum);
  }
  return (
    <Card className={cn('pt-8', className)}>
      <ReactEcharts
        option={option}
      />
    </Card>
  )
}

export default ResultsWeeklyDistribution
