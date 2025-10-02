import {
  Branch,
  Business,
  Feedback,
  FeedbackHooters,
  FeedbackGus,
  FeedbackPerRating,
  Waiter,
} from "@/app/types/business";
import { DateRange } from "@/app/types/general";
import { isWithinInterval } from "date-fns";

type ITypesOfConsume = {
  [key: string]: number;
};

/** Utils de lectura robusta (acepta camelCase y PascalCase) */
const getDateSafe = (obj: any): Date | null => {
  const raw =
    obj?.creationDate ?? obj?.createdAt ?? obj?.CreationDate ?? obj?.CreatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getNumberSafe = (obj: any, ...keys: string[]): number | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number") return v;
  }
  return undefined;
};

const getBoolSafe = (obj: any, ...keys: string[]): boolean | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "boolean") return v;
  }
  return undefined;
};

const getStringSafe = (obj: any, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string") return v;
  }
  return undefined;
};

/** Periodo previo con mismo tamaño que el actual */
const getPreviousPeriod = (currentPeriod: DateRange) => {
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  if (currentPeriod.to === undefined) return undefined;

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
  const { from, to = new Date() } = period;
  const interval = { start: from, end: to };

  const filtered = feedbacks.filter((feedback) => {
    const feedbackDate = getDateSafe(feedback);
    return feedbackDate ? isWithinInterval(feedbackDate, interval) : false;
  });

  return filtered.sort((a, b) => {
    const da = getDateSafe(a)?.getTime() ?? 0;
    const db = getDateSafe(b)?.getTime() ?? 0;
    return da - db;
  });
};

const incrementRatingCount = (
  ratings: { [key: number]: number },
  rating: number
) => {
  ratings[rating] = (ratings[rating] ?? 0) + 1;
};

const processFeedbacks = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[],
  ratings: { [key: number]: number }
) => {
  feedbacks.forEach((feedback) => {
    const rating =
      getNumberSafe(feedback, "rating", "Rating") ??
      getNumberSafe(feedback, "experience");

    if (typeof rating === "number") {
      incrementRatingCount(ratings, rating);
    }
  });
};

const calculateNumberOfFeedbackPerRating = (waiters: Waiter[]) => {
  waiters.forEach((waiter) => {
    waiter.numberOfFeedbackPerRating = {};

    if (waiter.feedbacks) {
      processFeedbacks(
        waiter.feedbacks as any[],
        waiter.numberOfFeedbackPerRating
      );
    }

    if (waiter.customers) {
      waiter.customers.forEach((customer) => {
        if (customer.feedbacks) {
          processFeedbacks(
            customer.feedbacks as any[],
            waiter.numberOfFeedbackPerRating!
          );
        }
      });
    }
  });

  return waiters;
};

export const getAllWaitersData = (business: Business | null | undefined) => {
  const mainWaitersData = (business as any)?.meseros || [];
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

    const waiterFeedbacksCurrentPeriod = getFeedacksByPeriod(
      (waiter.feedbacks as any[]) || [],
      dateRange
    );

    waiterFeedbacksCurrentPeriod.forEach((feedback) => {
      const rating = getNumberSafe(feedback, "rating", "Rating");
      if (typeof rating === "number") {
        numberOfFeedbackPerRating[rating] =
          (numberOfFeedbackPerRating[rating] ?? 0) + 1;
        feedbackSum += rating;
      }
    });

    const count = waiterFeedbacksCurrentPeriod.length;
    const newAverageRating = Number(
      (count ? feedbackSum / count : 0).toFixed(1)
    );

    waiter.numberOfSurveys = count;
    (waiter as any).ratingAverage = newAverageRating || 0; // si tu Waiter lo incluye
    waiter.numberOfFeedbackPerRating = { ...numberOfFeedbackPerRating };
    (waiter as any).businessName = businessName;

    return waiter;
  });

  return updatedWaiters;
};

export const getAllWaitersDataPerPeriod = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const mainWaitersData = (business as any)?.meseros || [];
  const businessName = (business as any)?.name ?? (business as any)?.Name ?? "";
  const mainWaitersStatsData = calculateNumberOfFeedbackPerRatingPerPeriod(
    mainWaitersData,
    dateRange,
    businessName
  );

  const waitersData = mainWaitersStatsData.filter(
    (waiter) => (waiter.numberOfSurveys ?? 0) > 0
  );
  return waitersData;
};

export const getTotalWaitersDataPerPeriod = (
  business: Business | null | undefined,
  dateRange: DateRange
) => {
  const mainWaitersData = (business as any)?.meseros || [];
  const businessName = (business as any)?.name ?? (business as any)?.Name ?? "";
  const mainWaitersStatsData = calculateNumberOfFeedbackPerRatingPerPeriod(
    mainWaitersData,
    dateRange,
    businessName
  );
  const branchWaitersData: Waiter[] = [];

  const branches: Branch[] =
    ((business as any)?.sucursales ?? (business as any)?.branches) || [];

  if (branches?.length) {
    branches.forEach((branch) => {
      const branchWaiters = getTotalWaitersDataPerPeriod(
        branch as any,
        dateRange
      );
      branchWaitersData.push(...branchWaiters);
    });
  }

  const allWaitersData: Waiter[] = [
    ...mainWaitersStatsData,
    ...branchWaitersData,
  ];
  const waitersData = allWaitersData.filter(
    (waiter) => (waiter.numberOfSurveys ?? 0) > 0
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
    const businessName = (waiter as any).businessName || "UnknownBusiness";

    if (!groupedData[businessName]) {
      groupedData[businessName] = [];
    }

    groupedData[businessName].push({
      latestSum: (waiter as any).latestSum,
      ratingAverage: (waiter as any).ratingAverage,
      gender: waiter.gender,
      name: waiter.name,
      numberOfSurveys: waiter.numberOfSurveys,
      feedbacks: waiter.feedbacks,
      numberOfFeedbackPerRating: waiter.numberOfFeedbackPerRating,
      id: waiter.id ?? "",
      sucursalId: (waiter as any).sucursalId ?? "",
    } as any);
  });

  return groupedData;
};

export const getFeedbacksFromBranch = (
  branch: Branch | null
): (Feedback | FeedbackHooters | FeedbackGus)[] => {
  const branchName = (branch as any)?.name ?? (branch as any)?.Name;

  const customerBranchFeedbackData =
    branch?.customers?.flatMap((customer) =>
      (
        ((customer as any)?.feedbacks ?? []) as (
          | Feedback
          | FeedbackHooters
          | FeedbackGus
        )[]
      ).map((feedback: Feedback | FeedbackHooters | FeedbackGus) => ({
        ...feedback,
        businessName: branchName,
      }))
    ) || [];

  const branchFeedbackData =
    (branch as any)?.feedbacks?.map((feedback: any) => ({
      ...feedback,
      businessName: branchName,
    })) || [];

  const customerWaitersFeedbackData =
    getAllWaitersData(branch as any)
      ?.flatMap((waiter) => waiter.customers || [])
      .flatMap((customer) =>
        (customer?.feedbacks || []).map((feedback) => ({
          ...feedback,
          businessName: branchName,
        }))
      ) || [];

  const waitersFeedbackData =
    getAllWaitersData(branch as any)
      ?.flatMap((waiter) => waiter.feedbacks || [])
      .map((feedback) => ({ ...feedback, businessName: branchName })) || [];

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
  const businessName = (business as any)?.name ?? (business as any)?.Name;

  const businessFeedbackData =
    getAllFeedbacksFromBusiness(business)?.map((feedback) => ({
      ...feedback,
      businessName,
    })) || [];

  const branchFeedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] = [];

  const branches: Branch[] =
    ((business as any)?.sucursales ?? (business as any)?.branches) || [];

  if (branches?.length) {
    branches.forEach((branch) => {
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
  const customerFeedbackData = (business?.customers || []).flatMap(
    (customer) =>
      ((customer as any).feedbacks ?? []) as (
        | Feedback
        | FeedbackHooters
        | FeedbackGus
      )[]
  );

  const businessFeedbackData = (business as any)?.feedbacks || [];

  const customerWaitersFeedbackData =
    getAllWaitersData(business as any).flatMap((waiter) =>
      (waiter?.customers || [])?.flatMap((customer) => customer.feedbacks || [])
    ) || [];

  const waitersFeedbackData =
    getAllWaitersData(business as any).flatMap(
      (waiter) => waiter.feedbacks || []
    ) || [];

  const allFeedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] = [
    ...customerFeedbackData,
    ...businessFeedbackData,
    ...customerWaitersFeedbackData,
    ...waitersFeedbackData,
  ] as any[];

  return allFeedbacks;
};

export const getDateFromFeedback = (
  feedback: Feedback | FeedbackHooters | FeedbackGus
) => {
  return getDateSafe(feedback) ?? new Date(0);
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

  feedbacks.forEach((feedback) => {
    const dinners = getStringSafe(feedback, "dinners", "Dinners");
    if (!dinners) return;
    typesOfConsume[dinners] = (typesOfConsume[dinners] ?? 0) + 1;
  });

  const mostFrequentNumberOfDinnersOnTable = (() => {
    if (Object.keys(typesOfConsume).length === 0) return null;
    const keys = ["1-2", "2-4", "+4"];
    const subset: ITypesOfConsume = {};
    keys.forEach((k) => (subset[k] = typesOfConsume[k] ?? 0));
    return keys.reduce((a, b) => (subset[a] > subset[b] ? a : b));
  })();

  const numberOfDeliveries =
    typesOfConsume["Domicilio"] ?? typesOfConsume["domicilio"] ?? 0;
  const numberOfToGo =
    typesOfConsume["Para llevar"] ?? typesOfConsume["toGo"] ?? 0;

  return {
    mostFrequentNumberOfDinnersOnTable,
    numberOfDeliveries,
    numberOfToGo,
  };
};

export const getAverageScore = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[]
) => {
  const totalScore: number = feedbacks.reduce((acc, feedback) => {
    const rating = getNumberSafe(feedback, "rating", "Rating") ?? 0;
    return acc + Number(rating);
  }, 0);

  const averageScore = feedbacks.length > 0 ? totalScore / feedbacks.length : 0;
  return averageScore;
};

export const getStarsAverageScore = (
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[] | undefined,
  source: "hooters" | "pollo-gus" | "all"
) => {
  if (feedbacks !== undefined && feedbacks.length == 0) return {};
  let properties: string[] = [];

  if (source === "hooters") {
    properties = [
      "courtesy",
      "placeCleanness",
      "quickness",
      "foodQuality",
      "climate",
      "experience",
    ];
  }
  if (source === "pollo-gus") {
    properties = [
      "treatment",
      "productTaste",
      "cashServiceSpeed",
      "productDeliverySpeed",
      "placeCleanness",
      "satisfaction",
    ];
  }

  const starsAverage: { [key: string]: number } = {};
  properties.forEach((property) => {
    // acepta camelCase y PascalCase:
    const alt = property[0].toUpperCase() + property.slice(1); // e.g. 'courtesy' -> 'Courtesy'
    const totalRating =
      feedbacks &&
      feedbacks.reduce((acc, curr) => {
        const v = getNumberSafe(curr as any, property, alt) ?? 0;
        return acc + v;
      }, 0);

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
  if (totalKeys === 0) return null;

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
  if (data.length === 0) return undefined;
  return data[data.length - 1];
}

export function isEmpty<T>(data: T[]): boolean {
  return data.length === 0;
}

export function isNotEmpty<T>(data: T[]): boolean {
  return data.length !== 0;
}

/** Compatibilidad: antes devolvías Timestamp; ahora devolvemos Date o null */
export const convertToTimestamp = (
  date: Date | string | number | null | undefined
): Date | null => {
  if (date === null || date === undefined) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Formatea segundos a mm:ss o "X s" */
export const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  if (seconds < 60) {
    return `${seconds.toFixed(0)} s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} s`;
  }
};
