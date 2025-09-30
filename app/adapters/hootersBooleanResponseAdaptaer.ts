import { Business, OriginAdapted } from '@/app/types/business'
import { IFeedbackAdaptado } from '@/app/types/adapters'
import { getFeedacksByPeriod } from '@/app/helpers'
import { DateRange } from '@/app/types/general'

export const hootersBooleanResponseAdapter = (
  business: Business | null | undefined,
  dateRange: DateRange,
  property: 'Recommending' | 'ComeBack'
  ) => {
  const feedbacksData = business?.feedbacks || []

  const feedbacks = getFeedacksByPeriod(feedbacksData || [], dateRange)

  const adapted: IFeedbackAdaptado = {}
  feedbacks?.forEach(item => {
    if (property in item) {
      if ((item as any)[property]) {
        if (adapted['si']) {
          adapted['si']++
        } else {
          adapted['si'] = 1
        }
      } else {
        if (adapted['no']) {
          adapted['no']++
        } else {
          adapted['no'] = 1
        }
      }
    }
  })
  const adaptedArray = Object.entries(adapted)
  adaptedArray.sort((a, b) => a[1] - b[1])
  const sortedAdapted = Object.fromEntries(adaptedArray)

  const hootersBooleanResponseData: OriginAdapted[] = Object.keys(sortedAdapted).map(key => {
    return {
      value: adapted[key],
      name: key
    }
  })

  return hootersBooleanResponseData
}
