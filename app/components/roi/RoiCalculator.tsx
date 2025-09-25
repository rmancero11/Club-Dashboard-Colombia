import { HTMLAttributes } from 'react';

import { cn } from '@/app/lib/utils';
import { Badge } from '../ui/Badge';
import { Business } from '@/app/types/business';
import useGetRoiData from '@/app/hooks/useGetRoiData';
import CardWidget from '../ui/CardWidget';
import { IconReportMoney } from '@tabler/icons-react';
import { DateRange, Preset } from '@/app/types/general';
import { format, isSameDay } from 'date-fns';
import { RoiCalcSchemaProps } from '@/app/validators/roiCalculatorSchema';

type IRoiCalculatorhartProps = {
  businessData: Business | null | undefined;
  dateRange: DateRange;
  preset: Preset | undefined;
  investmentValues?: RoiCalcSchemaProps;
};

function RoiCalculator({
  businessData,
  className,
  dateRange,
  preset,
  investmentValues,
}: IRoiCalculatorhartProps & HTMLAttributes<HTMLDivElement>) {
  const {
    feedbacks = [],
    Country: country,
    PricePlan: pricePlan = 2750000,
  } = businessData || {};
  const businessRoiData = {
    feedbacks: feedbacks,
    country,
    pricePlan,
  };
  const { roi, roiPercentage, isPositive } = useGetRoiData({
    businessRoiData,
    dateRange,
    investmentValues,
  });
  const hasPreset = preset !== undefined;
  const { from, to = new Date() } = dateRange;
  const isSameRangeDate = isSameDay(new Date(from), new Date(to));
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy');
  const formattedToDate = format(new Date(to), 'MMM dd yyyy');
  const customRangeDate = isSameRangeDate
    ? `${formattedFromDate}`
    : `${formattedFromDate} - ${formattedToDate}`;
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate;

  return (
    <CardWidget
      className={cn(className)}
      title="ROI (retorno)"
      icon={<IconReportMoney className="h-4 w-4" />}
      subtitle={queryRangeDate}
      tooltipContent="ROI que se obtiene de la inversión de marketing.">
      <div className="flex flex-wrap items-center justify-end xs:justify-start">
        <div className="text-2xl font-bold mr-2">{roi}</div>
        <Badge variant={isPositive ? 'success' : 'destructive'}>
          {' '}
          {roiPercentage.toFixed(0)}%
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground" />
    </CardWidget>
  );
}

export default RoiCalculator;
