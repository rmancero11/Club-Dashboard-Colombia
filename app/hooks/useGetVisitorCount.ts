import { getFeedbackInPastPeriod, getFeedacksByPeriod } from '@/app/helpers'
import { Business } from '@/app/types/business'
import { DateRange } from '@/app/types/general'

type Props = {
   businessData: Business | null | undefined
   dateRange: DateRange
}

function useGetVisitorCount ({ businessData, dateRange }: Props) {
  const feedbacks = businessData?.feedbacks || []

  const lastPeriodFeedbacks = getFeedbackInPastPeriod(feedbacks, dateRange)
  const currentPeriodFeedbacks = getFeedacksByPeriod(feedbacks, dateRange)
  const lastPeriodFeedbacksCount = lastPeriodFeedbacks.length
  const currentPeriodFeedbacksCount = currentPeriodFeedbacks.length

  const diff = currentPeriodFeedbacksCount - lastPeriodFeedbacksCount
  const diffPercentage = lastPeriodFeedbacksCount > 0 ? (diff / lastPeriodFeedbacksCount) * 100 : 0
  const isPositive = diff > 0

  return {
    lastPeriodFeedbacksCount,
    currentPeriodFeedbacksCount,
    diff,
    diffPercentage,
    isPositive
  }
}

export default useGetVisitorCount
