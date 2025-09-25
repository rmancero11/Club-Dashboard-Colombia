import {
  calculateTotalAverage,
  getAverageScore,
  getFeedacksByPeriod,
  getFeedbackInPastPeriod,
} from '@/app/helpers';
import { Business } from '@/app/types/business';
import { DateRange } from '@/app/types/general';
import { getStarsAverageScore } from '@/app/helpers';

type Props = {
  businessData: Business | null | undefined;
  dateRange: DateRange;
};

export function useGetAverageScore({ businessData, dateRange }: Props) {
  const feedbacks = businessData?.feedbacks || [];

  const lasPeriodFeedbacks = getFeedbackInPastPeriod(feedbacks, dateRange);
  const feedbacksInPeriod = getFeedacksByPeriod(feedbacks, dateRange);
  const allFeedBacks = feedbacksInPeriod;
  const allFeedbacksAverageScore = getAverageScore(allFeedBacks);

  const lastPeriodAverageScore = getAverageScore(lasPeriodFeedbacks);
  const currentPeriodAverageScore = getAverageScore(feedbacksInPeriod);

  const diff = currentPeriodAverageScore - lastPeriodAverageScore;
  const diffPercentage =
    lastPeriodAverageScore > 0 ? (diff / lastPeriodAverageScore) * 100 : 0;
  const isPositive = diff > 0;

  return {
    lastPeriodAverageScore: lastPeriodAverageScore.toFixed(2),
    currentPeriodAverageScore: currentPeriodAverageScore.toFixed(2),
    diff: diff.toFixed(2),
    diffPercentage: diffPercentage.toFixed(0),
    isPositive,
    allFeedbacksAverageScore,
    allFeedBacksCount: allFeedBacks.length,
  };
}

export function useGetHootersAverageScore({ businessData, dateRange }: Props) {
  const feedbacks = businessData?.feedbacks || [];

  const lasPeriodFeedbacks = getFeedbackInPastPeriod(feedbacks, dateRange);
  const feedbacksInPeriod = getFeedacksByPeriod(feedbacks, dateRange);
  const allFeedBacks = feedbacksInPeriod;

  const questionsAverageScore = getStarsAverageScore(allFeedBacks, 'hooters');
  const currentPeriodAverageScore = calculateTotalAverage(
    questionsAverageScore
  );

  const lastPeriodQuestionsAverageScore = getStarsAverageScore(
    lasPeriodFeedbacks,
    'hooters'
  );

  const lastPeriodAverageScore = calculateTotalAverage(
    lastPeriodQuestionsAverageScore
  );

  const diff = (currentPeriodAverageScore || 0) - (lastPeriodAverageScore || 0);
  const diffPercentage =
    lastPeriodAverageScore && lastPeriodAverageScore > 0
      ? (diff / lastPeriodAverageScore) * 100
      : 0;
  const isPositive = diff > 0;

  return {
    lastPeriodAverageScore: lastPeriodAverageScore?.toFixed(2),
    currentPeriodAverageScore: currentPeriodAverageScore?.toFixed(2),
    diff: diff.toFixed(2),
    diffPercentage: diffPercentage.toFixed(0),
    isPositive,
    allFeedBacksCount: allFeedBacks.length,
    questionsAverageScore,
  };
}

export function useGetGusAverageScore({ businessData, dateRange }: Props) {
  const feedbacks = businessData?.feedbacks || [];

  const lasPeriodFeedbacks = getFeedbackInPastPeriod(feedbacks, dateRange);
  const feedbacksInPeriod = getFeedacksByPeriod(feedbacks, dateRange);
  const allFeedBacks = feedbacksInPeriod;

  const questionsAverageScore = getStarsAverageScore(allFeedBacks, 'pollo-gus');
  const currentPeriodAverageScore = calculateTotalAverage(
    questionsAverageScore
  );

  const lastPeriodQuestionsAverageScore = getStarsAverageScore(
    lasPeriodFeedbacks,
    'pollo-gus'
  );

  const lastPeriodAverageScore = calculateTotalAverage(
    lastPeriodQuestionsAverageScore
  );

  const diff = (currentPeriodAverageScore || 0) - (lastPeriodAverageScore || 0);
  const diffPercentage =
    lastPeriodAverageScore && lastPeriodAverageScore > 0
      ? (diff / lastPeriodAverageScore) * 100
      : 0;
  const isPositive = diff > 0;

  return {
    lastPeriodAverageScore: lastPeriodAverageScore?.toFixed(2),
    currentPeriodAverageScore: currentPeriodAverageScore?.toFixed(2),
    diff: diff.toFixed(2),
    diffPercentage: diffPercentage.toFixed(0),
    isPositive,
    allFeedBacksCount: allFeedBacks.length,
    questionsAverageScore,
  };
}
