import {
  Branch,
  Business,
  Feedback,
  FeedbackHooters,
  FeedbackGus,
  FeedbackPerRating,
  Waiter,
} from '@/app/types/business';
import { DateRange } from '@/app/types/general';
import { isWithinInterval } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type ITypesOfConsume = {
  [key: string]: number;
};

const getPreviousPeriod = (currentPeriod: DateRange) => {
  const millisecondsInADay = 24 * 60 * 60 * 1000;

  if (currentPeriod.to === undefined) {
    return undefined;
  }

  const timeDifference =
    currentPeriod.to.getTime() - currentPeriod.from.getTime();
  const daysInCurrentPeriod = timeDifference / millisecondsInADay;
  const previousPeriodFrom = new Date(
    currentPeriod.from.getTime() - daysInCurrentPeriod * millisecondsInADay
  );
  const previousPeriodTo = new Date(
    previousPeriodFrom.getTime() + timeDifference
  );

  return { from: previousPeriodFrom, to: previousPeriodTo };
};

export const getFeedbackInPastPeriod = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] | null,
  period: DateRange
) => {
  const previousPeriod = getPreviousPeriod(period);
  if (previousPeriod) {
    return getFeedacksByPeriod(feedbacks, previousPeriod);
  }
  return [];
};

export const getFeedacksByPeriod = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] | null,
  period: DateRange
) => {
  if (!feedbacks) return [];
  const feedbacksByMonth = feedbacks.filter((feedback) => {
    const { CreationDate } = feedback;
    // using isWithinInterval from date-fns to check if the feedback date is within the period
    const feedbackDate = new Date(CreationDate.seconds * 1000);
    const { from, to = new Date() } = period;
    const interval = { start: from, end: to };
    return isWithinInterval(feedbackDate, interval);
  });
  return feedbacksByMonth.sort((a, b) => {
    const dateA = new Date(a.CreationDate.seconds * 1000).getTime();
    const dateB = new Date(b.CreationDate.seconds * 1000).getTime();
    return dateA - dateB;
  });
};

const incrementRatingCount = (
  ratings: { [key: number]: number },
  rating: number
) => {
  if (ratings[rating]) {
    ratings[rating] += 1;
  } else {
    ratings[rating] = 1;
  }
};

const processFeedbacks = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[],
  ratings: { [key: number]: number }
) => {
  feedbacks.forEach((feedback) => {
    if ('Rating' in feedback) {
      incrementRatingCount(ratings, feedback.Rating);
    }
  });
};

const calculateNumberOfFeedbackPerRating = (waiters: Waiter[]) => {
  waiters.forEach((waiter) => {
    waiter.numberOfFeedbackPerRating = { ...{} };

    if (waiter.feedbacks) {
      processFeedbacks(waiter.feedbacks, waiter.numberOfFeedbackPerRating);
    }

    if (waiter.customers) {
      waiter.customers.forEach((customer) => {
        if (customer.feedbacks) {
          processFeedbacks(
            customer.feedbacks,
            waiter.numberOfFeedbackPerRating
          );
        }
      });
    }
  });

  return waiters;
};

export const getAllWaitersData = (business: Business | null | undefined) => {
  const mainWaitersData = business?.meseros || [];
  const mainWaitersStatsData =
    calculateNumberOfFeedbackPerRating(mainWaitersData);

  const waitersData: Waiter[] = [...mainWaitersStatsData];

  return waitersData;
};

const calculateNumberOfFeedbackPerRatingPerPeriod = (
  waiters: Waiter[],
  dateRange: DateRange,
  businessName: string
) => {
  const updatedWaiters = waiters.map((originalWaiter) => {
    const waiter = { ...originalWaiter };

    const numberOfFeedbackPerRating: FeedbackPerRating = {};

    let feedbackSum = 0;
    const customerWaiterFeedbacks =
      waiter.customers?.flatMap((customer) => customer.feedbacks) || [];
    const waiterFeedbacksCurrentPeriod = getFeedacksByPeriod(
      waiter.feedbacks || [],
      dateRange
    );

    waiterFeedbacksCurrentPeriod.forEach((feedback) => {
      if ('Rating' in feedback) {
        if (numberOfFeedbackPerRating[feedback.Rating]) {
          numberOfFeedbackPerRating[feedback.Rating] += 1;
        } else {
          numberOfFeedbackPerRating[feedback.Rating] = 1;
        }
        feedbackSum += feedback.Rating;
      }
    });

    const newAverageRating = Number(
      (feedbackSum / waiterFeedbacksCurrentPeriod.length).toFixed(1)
    );

    waiter.numberOfSurveys = waiterFeedbacksCurrentPeriod.length;
    waiter.ratingAverage = newAverageRating || 0;
    waiter.numberOfFeedbackPerRating = { ...numberOfFeedbackPerRating };
    waiter.businessName = businessName;

    return waiter;
  });

  return updatedWaiters;
};

export const getAllWaitersDataPerPeriod = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const mainWaitersData = business?.meseros || [];
  const businessName = business?.Name || '';
  const mainWaitersStatsData = calculateNumberOfFeedbackPerRatingPerPeriod(
    mainWaitersData,
    dateRange,
    businessName
  );

  const waitersData = mainWaitersStatsData.filter(
    (waiter) => waiter.numberOfSurveys > 0
  );
  return waitersData;
};

export const getTotalWaitersDataPerPeriod = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const mainWaitersData = business?.meseros || [];
  const businessName = business?.Name || '';
  const mainWaitersStatsData = calculateNumberOfFeedbackPerRatingPerPeriod(
    mainWaitersData,
    dateRange,
    businessName
  );
  const branchWaitersData: Waiter[] = [];

  if (business?.sucursales) {
    business.sucursales.forEach((branch) => {
      const branchWaiters = getTotalWaitersDataPerPeriod(branch, dateRange);
      branchWaitersData.push(...branchWaiters);
    });
  }

  const allWaitersData: Waiter[] = [
    ...mainWaitersStatsData,
    ...branchWaitersData,
  ];
  const waitersData = allWaitersData.filter(
    (waiter) => waiter.numberOfSurveys > 0
  );

  return waitersData;
};

interface GroupedWaitersData {
  [businessName: string]: Waiter[];
}

export const groupWaitersByBusinessName = (
  waitersData: Waiter[]
): GroupedWaitersData => {
  const groupedData: GroupedWaitersData = {};

  waitersData.forEach((waiter) => {
    const businessName = waiter.businessName || 'UnknownBusiness';

    if (!groupedData[businessName]) {
      groupedData[businessName] = [];
    }

    groupedData[businessName].push({
      latestSum: waiter.latestSum,
      ratingAverage: waiter.ratingAverage,
      gender: waiter.gender,
      name: waiter.name,
      numberOfSurveys: waiter.numberOfSurveys,
      feedbacks: waiter.feedbacks,
      numberOfFeedbackPerRating: waiter.numberOfFeedbackPerRating,
      id: '',
      sucursalId: '',
    });
  });

  return groupedData;
};

export const getFeedbacksFromBranch = (
  branch: Branch | null
): (Feedback | FeedbackHooters | FeedbackGus)[] => {
  const customerBranchFeedbackData =
    branch?.customers?.flatMap((customer) =>
      customer.feedbacks.map((feedback) => ({
        ...feedback,
        BusinessName: branch.Name,
      }))
    ) || [];
  const branchFeedbackData =
    branch?.feedbacks?.map((feedback) => ({
      ...feedback,
      BusinessName: branch.Name,
    })) || [];
  const customerWaitersFeedbackData =
    getAllWaitersData(branch)
      ?.flatMap((waiter) => waiter.customers)
      .flatMap((customer) =>
        customer?.feedbacks.map((feedback) => ({
          ...feedback,
          BusinessName: branch?.Name,
        }))
      ) || [];
  const waitersFeedbackData =
    getAllWaitersData(branch)
      ?.flatMap((waiter) => waiter.feedbacks)
      .map((feedback) => ({ ...feedback, BusinessName: branch?.Name })) || [];

  const totalBranchFeedback: (Feedback | FeedbackHooters | FeedbackGus)[] = [
    ...customerBranchFeedbackData,
    ...branchFeedbackData,
    ...(customerWaitersFeedbackData as Feedback[]),
    ...(waitersFeedbackData as Feedback[]),
  ];

  return totalBranchFeedback;
};

export const getTotalFeedbacksFromBusiness = (
  business: Business | null
): (Feedback | FeedbackHooters | FeedbackGus)[] => {
  const businessFeedbackData =
    getAllFeedbacksFromBusiness(business).map((feedback) => ({
      ...feedback,
      BusinessName: business?.Name,
    })) || [];
  const branchFeedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] = [];

  if (business?.sucursales) {
    business.sucursales.forEach((branch) => {
      const branchFeedbackData = getFeedbacksFromBranch(branch);
      branchFeedbacks.push(...branchFeedbackData);
    });
  }
  const allFeedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] = [
    ...businessFeedbackData,
    ...branchFeedbacks,
  ];
  return allFeedbacks || [];
};

export const getAllFeedbacksFromBusiness = (
  business: Business | null | undefined
) => {
  const customerFeedbackData =
    business?.customers?.flatMap((customer) => customer.feedbacks || []) || [];
  const businessFeedbackData = business?.feedbacks || [];
  const customerWaitersFeedbackData =
    getAllWaitersData(business).flatMap((waiter) =>
      waiter?.customers?.flatMap((customer) => customer.feedbacks)
    ) || [];
  const waitersFeedbackData =
    getAllWaitersData(business).flatMap((waiter) => waiter.feedbacks) || [];

  const allFeedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] = [
    ...customerFeedbackData,
    ...businessFeedbackData,
    ...customerWaitersFeedbackData,
    ...waitersFeedbackData,
  ] as Feedback[];

  return allFeedbacks;
};

export const getDateFromFeedback = (
  feedback: Feedback | FeedbackHooters | FeedbackGus
) => {
  const creationDate: Timestamp = feedback.CreationDate;
  const timestamp = Timestamp.fromMillis(
    creationDate.seconds * 1000 + creationDate.nanoseconds / 1000000
  );
  const date = timestamp.toDate();
  return date;
};

export const getStartAndEndOfWeek = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0 - now.getDay() * 24 * 60 * 60 * 1000);

  const endOfWeek = new Date(now);
  endOfWeek.setHours(
    23,
    59,
    59,
    999 + (6 - now.getDay()) * 24 * 60 * 60 * 1000
  );

  return { startOfWeek, endOfWeek };
};

// const getFeedbackOfTheCurrentWeek = (feedbacks: Feedback[]) => {
//   const { startOfWeek, endOfWeek } = getStartAndEndOfWeek()

//   const feedbacksOfTheWeek = feedbacks.filter((feedback) => {
//     const feedbackDate = getDateFromFeedback(feedback)
//     return feedbackDate >= startOfWeek && feedbackDate <= endOfWeek
//   })

//   return feedbacksOfTheWeek
// }

const getMostFrequentNumberOfDinners = (typesOfConsume: ITypesOfConsume) => {
  if (Object.keys(typesOfConsume).length === 0) return null;
  const rangeOfDinnersFrequence: ITypesOfConsume = {};

  rangeOfDinnersFrequence['1-2'] = typesOfConsume['1-2'];
  rangeOfDinnersFrequence['2-4'] = typesOfConsume['2-4'];
  rangeOfDinnersFrequence['+4'] = typesOfConsume['+4'];

  const mostFrequent = Object.keys(rangeOfDinnersFrequence).reduce((a, b) =>
    rangeOfDinnersFrequence[a] > rangeOfDinnersFrequence[b] ? b : a
  );
  return mostFrequent;
};

export const getMostFrequentTypeOfConsume = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const typesOfConsume: ITypesOfConsume = {};
  const feedbacks = getFeedacksByPeriod(
    getAllFeedbacksFromBusiness(business) || [],
    dateRange
  );
  // const allFeedbacks = getAllFeedbacksFromBusiness(business)

  feedbacks.forEach((feedback) => {
    if ('Dinners' in feedback) {
      if (typesOfConsume[feedback.Dinners]) {
        typesOfConsume[feedback.Dinners]++;
      } else {
        typesOfConsume[feedback.Dinners] = 1;
      }
    }
  });
  const mostFrequentNumberOfDinnersOnTable =
    getMostFrequentNumberOfDinners(typesOfConsume);
  const numberOfDeliveries = typesOfConsume.Domicilio;
  const numberOfToGo = typesOfConsume['Para llevar'];

  return {
    mostFrequentNumberOfDinnersOnTable,
    numberOfDeliveries,
    numberOfToGo,
  };
};

export const getAverageScore = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[]
) => {
  const totalScore: number = feedbacks.reduce(function (acc, feedback) {
    return acc + Number('Rating' in feedback ? feedback.Rating : 0);
  }, 0);
  const averageScore = feedbacks.length > 0 ? totalScore / feedbacks.length : 0;
  return averageScore;
};

export const getStarsAverageScore = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] | undefined,
  source: 'hooters' | 'pollo-gus' | 'all'
) => {
  if (feedbacks !== undefined && feedbacks.length == 0) return {};
  let properties: string[] = [];

  if (source === 'hooters') {
    properties = [
      'Courtesy',
      'PlaceCleanness',
      'Quickness',
      'FoodQuality',
      'Climate',
      'Experience',
    ];
  }
  if (source === 'pollo-gus') {
    properties = [
      'Treatment',
      'ProductTaste',
      'CashServiceSpeed',
      'ProductDeliverySpeed',
      'PlaceCleanness',
      'Satisfaction',
    ];
  }
  const starsAverage: { [key: string]: number } = {};
  properties.forEach((property) => {
    const totalRating =
      feedbacks &&
      feedbacks.reduce(
        (acc, curr) => acc + Number((curr as any)[property] || 0),
        0
      );
    if (totalRating && feedbacks) {
      starsAverage[property] = totalRating / feedbacks.length;
    }
  });
  return starsAverage;
};

export const calculateTotalAverage = (averageQuestions: {
  [key: string]: number;
}): number | null => {
  const keys = Object.keys(averageQuestions);
  const totalKeys = keys.length;
  if (totalKeys === 0) {
    return null;
  }
  const totalSum = keys.reduce((sum, key) => sum + averageQuestions[key], 0);
  const totalAverage = totalSum / totalKeys;
  return totalAverage;
};

export function getCountsPerList<K>(
  obj: Record<string, unknown>
): Map<K, number> {
  const counts = new Map<K, number>();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (Array.isArray((obj as Record<string, unknown>)[key])) {
        counts.set(
          key as unknown as K,
          ((obj as Record<string, unknown>)[key] as unknown[]).length
        );
      }
    }
  }
  return counts;
}

export function groupBy<T>(data: T[], key: keyof T): Record<string, T[]> {
  const resultMap: Record<string, T[]> = {};

  for (const item of data) {
    const keyValue = String(item[key]);

    if (!resultMap[keyValue]) {
      resultMap[keyValue] = [];
    }

    resultMap[keyValue].push(item);
  }
  return resultMap;
}

export function sortByDate<T>(
  data: T[],
  dateProperty: (item: T) => Date,
  ascending: boolean = true
): T[] {
  const sortedArray = [...data];

  sortedArray.sort((a, b) => {
    const dateA = dateProperty(a);
    const dateB = dateProperty(b);

    if (dateA < dateB) {
      return ascending ? -1 : 1;
    } else if (dateA > dateB) {
      return ascending ? 1 : -1;
    }
    return 0;
  });

  return sortedArray;
}

export function first<T>(data: T[]): T {
  return data[0];
}

export function last<T>(data: T[]): T | undefined {
  if (data.length === 0) {
    return undefined;
  }
  return data[data.length - 1];
}

export function isEmpty<T>(data: T[]): boolean {
  return data.length === 0;
}

export function isNotEmpty<T>(data: T[]): boolean {
  return data.length !== 0;
}

export const convertToTimestamp = (date: Timestamp) => {
  return Timestamp.fromMillis(date.seconds * 1000 + date.nanoseconds / 1000000);
};

export const formatTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds.toFixed(0)} s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes}:${
      remainingSeconds > 0 ? `${remainingSeconds.toFixed(0)} s` : ''
    }`;
  }
};
