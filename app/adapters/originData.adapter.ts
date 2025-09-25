import { Business, OriginAdapted } from '@/app/types/business'
import { IFeedbackAdaptado } from '@/app/types/adapters'
import { getFeedacksByPeriod } from '@/app/helpers'
import { DateRange } from '@/app/types/general'

export const originDataAdapter = (business: Business | null | undefined, dateRange: DateRange) => {
  const feedbacksData = business?.feedbacks || []

  const feedbacks = getFeedacksByPeriod(feedbacksData || [], dateRange)

  const adapted: IFeedbackAdaptado = {}
  feedbacks?.forEach(item => {
    if (item.Origin) {
      if (adapted[item.Origin]) {
        adapted[item.Origin]++
      } else {
        adapted[item.Origin] = 1
      }
    }
  })
  const adaptedArray = Object.entries(adapted)
  adaptedArray.sort((a, b) => a[1] - b[1])
  const sortedAdapted = Object.fromEntries(adaptedArray)

  const adaptedOriginData: OriginAdapted[] = Object.keys(sortedAdapted).map(key => {
    return {
      value: adapted[key],
      name: key
    }
  })

  return adaptedOriginData
}
