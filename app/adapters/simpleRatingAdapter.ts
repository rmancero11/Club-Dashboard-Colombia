import { Business, ImproveAdapted } from '@/app/types/business'
import { IFeedbackAdaptado } from '@/app/types/adapters'
import { getFeedacksByPeriod } from '@/app/helpers'
import { DateRange } from '@/app/types/general'
import { RATINGS } from '../constants/general'
import { OBJECT } from 'swr/_internal';

export const simpleRatingAdapter = (businessData: Business | null | undefined, dateRange: DateRange): ImproveAdapted[] | [] => {
  const feedbacksData = businessData?.feedbacks || []

  const feedbacks = getFeedacksByPeriod(feedbacksData, dateRange)

  const adapted: IFeedbackAdaptado = {}
  feedbacks?.forEach(item => {
    if ('Rating' in item) {
        if (adapted[RATINGS[item.Rating]]) {
          adapted[RATINGS[item.Rating]]++
        } else {
          adapted[RATINGS[item.Rating]] = 1
        }
    }
  })
  const simpleRatingAdapted: ImproveAdapted[] = Object.keys(adapted)
  .map(key => {
    return {
      value: adapted[key],
      name: key
    }
  })


  const sorted = [
    simpleRatingAdapted[2],
    simpleRatingAdapted[3],
    simpleRatingAdapted[0],
    simpleRatingAdapted[1],
  ]
  return sorted
}
