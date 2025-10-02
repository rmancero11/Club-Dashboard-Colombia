import { Business } from '@/app/types/business';
import { IFeedbackAdaptado } from '@/app/types/adapters';
import { getFeedacksByPeriod } from '@/app/helpers';
import { DateRange } from '@/app/types/general';
import { adaptedAverageTicket } from '../adapters/roi/getGreaterAverageTickets.adapter';

export const useGetRoiOriginChartData = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const feedbacksData = business?.feedbacks || [];

  const feedbacks = getFeedacksByPeriod(feedbacksData || [], dateRange);
  const adapted: IFeedbackAdaptado = {};
  feedbacks?.forEach((item) => {
    if (adapted[item.origin]) {
      const value = adaptedAverageTicket(
        'averageTicket' in item ? item.averageTicket : ''
      );
      adapted[item.origin] += value * 0.9;
    } else {
      const value = adaptedAverageTicket(
        'averageTicket' in item ? item.averageTicket : ''
      );
      adapted[item.origin] = value * 0.9;
    }
  });
  const adaptedArray = Object.entries(adapted).sort((a, b) => b[1] - a[1]);
  const roiPerOrigin = Object.fromEntries(adaptedArray);
  return { roiPerOrigin };
};

export default useGetRoiOriginChartData;
