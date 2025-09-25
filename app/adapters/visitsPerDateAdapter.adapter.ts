import { Business, VisitsPerDate } from '@/app/types/business'
import { IVisitsPerDateAdapter } from '@/app/types/adapters'
import { getDateFromFeedback, getFeedacksByPeriod } from '@/app/helpers'
import { DateRange } from '@/app/types/general'

export const visitsPerDateAdapter = (business: Business | null | undefined, dateRange: DateRange) => {
  const feedbacks = business?.feedbacks || []

  const allFeedbacks = getFeedacksByPeriod(feedbacks, dateRange)

  const adapted: IVisitsPerDateAdapter = {}
  allFeedbacks?.forEach(item => {
    const date = getDateFromFeedback(item)

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    const formattedDate: string = date.toLocaleDateString('es-EC', options)
    if (adapted[formattedDate]) {
      adapted[formattedDate]++
    } else {
      adapted[formattedDate] = 1
    }
  })

  const adaptedArray = Object.entries(adapted)
  const sortedAdapted:IVisitsPerDateAdapter = Object.fromEntries(adaptedArray)

  const adaptedVisitsPerDate: VisitsPerDate[] = Object.keys(sortedAdapted).map(key => {
    return {
      value: sortedAdapted[key],
      name: key
    }
  })

  return adaptedVisitsPerDate
}
