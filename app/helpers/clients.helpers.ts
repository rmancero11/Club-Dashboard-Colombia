import {
  Feedback,
  Client,
  FeedbackHooters,
  FeedbackGus,
  PremiumBusinessClient,
} from "@/app/types/business";
import { DateRange } from "../types/general";
import { getFeedacksByPeriod } from "@/app/helpers";

// ---------- Type guards ----------
function isSimpleFeedback(f: any): f is Feedback {
  return f && ("rating" in f || "createdAt" in f);
}

function isHootersFeedback(f: any): f is FeedbackHooters {
  return f && "creationDate" in f && ("experience" in f || "ambience" in f);
}

function isGusFeedback(f: any): f is FeedbackGus {
  return f && "creationDate" in f && ("treatment" in f || "satisfaction" in f);
}

function getCreationDateMs(
  f: Feedback | FeedbackHooters | FeedbackGus
): number {
  if (isSimpleFeedback(f)) {
    const d = (f as any).createdAt ?? (f as any).creationDate;
    return d ? new Date(d).getTime() : 0;
  }
  const d = (f as any).creationDate;
  return d ? new Date(d).getTime() : 0;
}

function getHasGoogleReview(
  f: Feedback | FeedbackHooters | FeedbackGus
): boolean {
  if (isSimpleFeedback(f)) {
    const rating = (f as any).rating as number | undefined;
    return typeof rating === "number" ? rating >= 4 : false;
  }
  const comeBack = (f as any).comeBack as boolean | undefined;
  const recommending = (f as any).recommending as boolean | undefined;
  return Boolean(comeBack || recommending);
}

type AnyClient =
  | Client
  | (PremiumBusinessClient & {
      feedback: FeedbackHooters | FeedbackGus;
    });

function getClientsTableData(
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[],
  period: DateRange
): AnyClient[] {
  try {
    const clientsList: AnyClient[] = [];

    if (feedbacks && feedbacks.length) {
      const filteredFeedbacks = getFeedacksByPeriod(feedbacks, period);

      filteredFeedbacks.forEach((feedback) => {
        const hasGoogleReview = getHasGoogleReview(feedback);

        if (isSimpleFeedback(feedback)) {
          const clientData: Client = {
            feedback,
            visits: 1,
            hasGoogleReview,
            businessName: (feedback as any)?.businessName,
            phoneNumber: (feedback as any)?.phoneNumber,
            acceptPromotions: (feedback as any)?.acceptPromotions,
          };
          clientsList.push(clientData);
        } else {
          const clientData: PremiumBusinessClient & {
            feedback: FeedbackHooters | FeedbackGus;
            visits: number;
            hasGoogleReview: boolean;
            businessName?: string;
            accpetPromotions?: boolean;
          } = {
            feedback,
            visits: 1,
            hasGoogleReview: (feedback as any)?.businessName,
            accpetPromotions: (feedback as any)?.acceptPromotions,
          };
          clientsList.push(clientData);
        }
      });
    }

    // Ordena por fecha de creación (Date), no por .seconds
    return clientsList.sort(
      (a, b) =>
        getCreationDateMs(b.feedback as any) -
        getCreationDateMs(a.feedback as any)
    );
  } catch (error) {
    console.log("ERROR: ", error);
    return [];
  }
}

export default getClientsTableData;
