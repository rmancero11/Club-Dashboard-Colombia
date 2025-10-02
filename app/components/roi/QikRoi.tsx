import { HTMLAttributes } from 'react';

import { cn } from '@/app/lib/utils';
import { Badge } from '../ui/Badge';
import { Business } from '@/app/types/business';
import CardWidget from '../ui/CardWidget';
import { IconReportMoney } from '@tabler/icons-react';
import { DateRange, Preset } from '@/app/types/general';
import { format, isSameDay } from 'date-fns';
import { RoiCalcSchemaProps } from '@/app/validators/roiCalculatorSchema';
import useGetQikRoiData from '@/app/hooks/useGetQikRoiData';

import { DEFAULT_INVESTMENT_VALUES } from '@/app/constants/roi';

type IQikRoitProps = {
  businessData: Business | null | undefined;
  dateRange: DateRange;
  preset: Preset | undefined;
  investmentValues?: RoiCalcSchemaProps;
};

function QikRoi({
  businessData,
  className,
  dateRange,
  preset,
  investmentValues = DEFAULT_INVESTMENT_VALUES,
}: IQikRoitProps & HTMLAttributes<HTMLDivElement>) {
  const {
    feedbacks = [],
    country: country,
    pricePlan: pricePlan = 2750000,
  } = businessData || {};
  const businessRoiData = {
    feedbacks,
    country,
    pricePlan,
  };
  const { roi, roiPercentage, isPositive } = useGetQikRoiData({
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
      title="ROI QIK"
      icon={<IconReportMoney className="h-4 w-4" />}
      subtitle={queryRangeDate}
      tooltipContent="ROI de la inversión de marketing en QIK Google."
      variant="secondary">
      <div className="flex flex-wrap items-center justify-end md:justify-start">
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

export default QikRoi;
