import type {
  Feedback,
  FeedbackGus,
  FeedbackHooters,
} from '@/app/types/business';

export const adaptedAverageTicket = (AverageTicket: string) => {
  const regex = /(\d+[.,]?\d*)/g;
  if (!AverageTicket) return 0;
  const value = AverageTicket.match(regex);
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
) => {
  if (!data) return [];
  return data.map((item) => {
    if ('AverageTicket' in item) {
      const { AverageTicket } = item;
      const value = adaptedAverageTicket(AverageTicket);
      return value;
    }
  });
};

export { getGreaterAverageTickets };
