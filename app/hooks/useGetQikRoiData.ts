import { getFeedacksByPeriod } from '@/app/helpers';
import { getGreaterAverageTickets } from '../adapters/roi/getGreaterAverageTickets.adapter';
import { getAverageTicketsReturn } from '../adapters/roi/getAverageTicketsReturn.adapter';
import { DateRange } from '@/app/types/general';
import { RoiCalcSchemaProps } from '@/app/validators/roiCalculatorSchema';
import { Business } from '@/app/types/business';
import { BUSINESS_CURRENCIES } from '@/app/constants/prices';
import { QIK_ROI_ORIGINS } from '@/app/constants/roi';

type BusinessRoiData = {
  feedbacks: Business['feedbacks'];
  country: Business['Country'] | undefined;
  pricePlan: Business['PricePlan'];
};

type Props = {
  businessRoiData: BusinessRoiData;
  dateRange: DateRange;
  investmentValues: RoiCalcSchemaProps;
};

function useGetQikRoiData({
  businessRoiData,
  dateRange,
  investmentValues,
}: Props) {
  const { country, feedbacks = [], pricePlan } = businessRoiData;
  const { from, to } = dateRange;
  const hasPeriod = from && to;
  const feedbacksByPeriod = hasPeriod
    ? getFeedacksByPeriod(feedbacks, dateRange)
    : [];
  const qikRoiFeedbacks = feedbacksByPeriod.filter((feedback) =>
    QIK_ROI_ORIGINS.includes(feedback.Origin)
  );
  const averageTickets = getGreaterAverageTickets(qikRoiFeedbacks || []);
  const averageTicketsReturn = getAverageTicketsReturn(averageTickets);
  const investmentValuesSum = Object.values(investmentValues).reduce(
    (acc, value) => acc + Number(value),
    0
  );
  const COST_OF_INVESTMENT = investmentValuesSum + pricePlan;
  const roi = averageTicketsReturn - COST_OF_INVESTMENT;
  const roiPercentage = (roi / COST_OF_INVESTMENT) * 100;
  const isPositive = roiPercentage > 0;

  const formattedAverageTicketsReturn = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: BUSINESS_CURRENCIES[country || 'US'],
    maximumFractionDigits: 0,
  }).format(Number(roi));

  return {
    roi: formattedAverageTicketsReturn,
    roiPercentage,
    isPositive,
  };
}

export default useGetQikRoiData;
