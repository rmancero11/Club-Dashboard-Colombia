import { Business, ImproveAdapted } from '@/app/types/business'
import { IFeedbackAdaptado } from '@/app/types/adapters'
import { getFeedacksByPeriod } from '@/app/helpers'
import { DateRange } from '@/app/types/general'

export const negativeFeedbackAdapter = (businessData: Business | null | undefined, dateRange: DateRange): ImproveAdapted[] | [] => {
  const feedbacksData = businessData?.feedbacks || []

  const feedbacks = getFeedacksByPeriod(feedbacksData, dateRange)

  const adapted: IFeedbackAdaptado = {}
  feedbacks?.forEach(item => {
    if ('Improve' in item) {
      item?.Improve?.forEach(imp => {
        if (adapted[imp]) {
          adapted[imp]++
        } else {
          adapted[imp] = 1
        }
      })
    }
  })
  const adaptedFeedback: ImproveAdapted[] = Object.keys(adapted).map(key => {
    return {
      value: adapted[key],
      name: key
    }
  })

  return adaptedFeedback
}
