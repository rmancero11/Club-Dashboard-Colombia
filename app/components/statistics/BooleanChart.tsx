import dynamic from 'next/dynamic';
import { Card } from '../ui/Card';
import { HTMLAttributes } from 'react';
import { cn } from '@/app/lib/utils';
import { Business } from '@/app/types/business';
import { DateRange, Preset } from '@/app/types/general';
import { format, isSameDay } from 'date-fns';
import { getCurrentMonth } from '@/app/helpers/dates.helpers';
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers';
import { hootersBooleanResponseAdapter } from '@/app/adapters/hootersBooleanResponseAdaptaer';

const ReactEcharts = dynamic(() => import('echarts-for-react'));

type IBooleanProps = {
  property: 'Recommending' | 'ComeBack';
  chartTitle: string;
  businessData: Business | null | undefined;
  dateRange: DateRange;
  preset: Preset | undefined;
};

const BooleanChart = ({
  property,
  chartTitle,
  businessData,
  dateRange,
  preset,
  className,
}: IBooleanProps & HTMLAttributes<HTMLDivElement>) => {
  const adaptedHootersRecommendationData = hootersBooleanResponseAdapter(
    businessData,
    dateRange,
    property
  );
  const lagendValues = adaptedHootersRecommendationData.map(
    (data) => data.name
  );

  const hasPreset = preset !== undefined;
  const { from, to = new Date() } = dateRange;
  const isSameRangeDate = isSameDay(new Date(from), new Date(to));
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy');
  const formattedToDate = format(new Date(to), 'MMM dd yyyy');
  const customRangeDate = isSameRangeDate
    ? `${formattedFromDate}`
    : `${formattedFromDate} - ${formattedToDate}`;
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate;

  const currentMonth = getCurrentMonth();

  const subtitle =
    queryRangeDate ||
    `${capitalizeFirstLetter(currentMonth)} ${new Date().getFullYear()}`;

  return (
    <Card className={cn('px-8 py-8', className)}>
      <ReactEcharts
        option={{
          color: ['#1F64B0', '#FF5D00'],
          tooltip: {
            trigger: 'item',
          },
          title: {
            left: 'center',
            textStyle: {
              overflow: 'breakAll',
            },
            text: `${chartTitle}\n(${subtitle})`,
          },
          legend: {
            top: 'bottom',
            left: 'center',
            data: lagendValues,
          },
          series: [
            {
              name: 'Respuestas',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              label: {
                position: 'inner',
                formatter: ' {b|{b}：}{c}  {per|{d}%}  ',
                backgroundColor: '#FFFF',
                color: '#000000',
                borderColor: '#8C8D8E',
                borderWidth: 1,
                borderRadius: 4,
                rich: {
                  a: {
                    color: '#4C5058',
                    lineHeight: 22,
                    align: 'center',
                  },
                  hr: {
                    borderColor: '#8C8D8E',
                    width: '100%',
                    borderWidth: 1,
                    height: 0,
                  },
                  b: {
                    color: '#4C5058',
                    fontSize: 14,
                    fontWeight: 'bold',
                    lineHeight: 33,
                  },
                  per: {
                    color: '#fff',
                    backgroundColor: '#4C5058',
                    padding: [3, 4],
                    borderRadius: 4,
                  },
                },
              },
              labelLine: {
                show: false,
              },
              data: adaptedHootersRecommendationData,
            },
          ],
        }}></ReactEcharts>
    </Card>
  );
};

export default BooleanChart;
