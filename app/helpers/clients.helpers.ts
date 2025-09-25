import {
  Feedback,
  Client,
  FeedbackHooters,
  FeedbackGus,
  PremiumBusinessClient,
} from '@/app/types/business';
import { DateRange } from '../types/general';
import { getFeedacksByPeriod } from '@/app/helpers';

function getClientsTableData(
  feedbacks: (Feedback | FeedbackHooters | FeedbackGus)[],
  period: DateRange
): (Client | PremiumBusinessClient)[] {
  try {
    const clientsList: (Client | PremiumBusinessClient)[] = [];
    if (feedbacks) {
      const filteredFeedbacks = getFeedacksByPeriod(feedbacks, period);
      filteredFeedbacks.forEach((feedback) => {
        if ('Rating' in feedback) {
          const rating = feedback?.Rating;
          const hasGoogleReview: boolean = rating ? rating >= 4 : false;
          const clientData: Client = {
            feedback: feedback || [],
            visits: 1 || 0,
            hasGoogleReview,
            businessName: feedback?.BusinessName,
            phoneNumber: feedback?.PhoneNumber,
            acceptPromotions: feedback.AcceptPromotions,
          };
          clientsList.push(clientData);
        } else {
          const hasGoogleReview: boolean = feedback.ComeBack ? true : false;
          const clientData: PremiumBusinessClient = {
            feedback: feedback || [],
            visits: 1 || 0,
            hasGoogleReview,
            businessName: feedback?.BusinessName,
            acceptPromotions: feedback.AcceptPromotions,
          };
          clientsList.push(clientData);
        }
      });
    }
    return clientsList.sort((a, b) => {
      return b.feedback.CreationDate.seconds - a.feedback.CreationDate.seconds;
    });
  } catch (error) {
    console.log('ERROR: ', error);
    return [];
  }
}

export default getClientsTableData;
