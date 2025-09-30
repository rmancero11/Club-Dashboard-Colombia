import type {
  Feedback,
  FeedbackGus,
  FeedbackHooters,
} from '@/app/types/business';

export const adaptedAverageTicket = (averageTicket: string) => {
  const regex = /(\d+[.,]?\d*)/g;
  if (!averageTicket) return 0;
  const value = averageTicket.match(regex);
  if (!value) return 0;
  let lastValue = value[value.length - 1];
  if (lastValue.includes('.')) {
    const array = lastValue.split('.');
    lastValue = array.join('');
  }
  return parseInt(lastValue, 10);
};

const getGreaterAverageTickets = (
  data: (Feedback | FeedbackHooters | FeedbackGus)[]
): number[] => {
  if (!data) return [];
  return data.map((item) => {
    if ('averageTicket' in item && typeof item.averageTicket === 'string') {
      const value = adaptedAverageTicket(item.averageTicket);
      return value;
    }
    return 0; 
  });
};

export { getGreaterAverageTickets };