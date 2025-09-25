const COLLECTION_NAME = process.env.NEXT_PUBLIC_VITE_APP_COLLECTION_NAME;
// Mostrar datos reales en el dashboard
const DASHBOARD_COLLECTION_NAME = 'qik_feedback';
const USERS_COLLECTION_NAME = 'businessUsers';
const BUCKET_NAME = 'qik_feedback_test';
const BUCKET_URL = `gs://${COLLECTION_NAME}`;
const ASSETS_FOLDER = {
  icons: 'business/icons',
  background: 'business/background',
};
const FEEDBACK_BASE_URL = 'https://feedback.qikstarts.com/?id=';
const LOYALTY_SUBCOLLECTION_NAME = 'loyalty';
const QIK_CUMPLE_SUBCOLLECTION_NAME = 'qik-cumple';
const QIK_REWARDS_SUBCOLLECTION_NAME = 'qik-rewards';
const QIK_STARS_SUBCOLLECTION_NAME = 'qik-stars';
const QIK_STARS_BENEFITS_SUBCOLLECTION_NAME = 'benefits';
const FREE_DINNER_SUBCOLLECTION_NAME = 'free-dinner';
const GIFT_CARD_SUBCOLLECTION_NAME = 'gift-card';
const STORE_SUBCOLLECTION_NAME = 'store';
const ALLIES_SUBCOLLECTION_NAME = 'allies';
const CALCULATOR_SUBCOLLECTION_NAME = 'starts-calculator';

export {
  COLLECTION_NAME,
  BUCKET_NAME,
  BUCKET_URL,
  ASSETS_FOLDER,
  USERS_COLLECTION_NAME,
  DASHBOARD_COLLECTION_NAME,
  FEEDBACK_BASE_URL,
  LOYALTY_SUBCOLLECTION_NAME,
  QIK_CUMPLE_SUBCOLLECTION_NAME,
  QIK_REWARDS_SUBCOLLECTION_NAME,
  QIK_STARS_SUBCOLLECTION_NAME,
  QIK_STARS_BENEFITS_SUBCOLLECTION_NAME,
  FREE_DINNER_SUBCOLLECTION_NAME,
  GIFT_CARD_SUBCOLLECTION_NAME,
  STORE_SUBCOLLECTION_NAME,
  ALLIES_SUBCOLLECTION_NAME,
  CALCULATOR_SUBCOLLECTION_NAME,
};

// DSC Charts

export const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const RATINGS: { [key: number]: string } = {
  1: 'Bad',
  2: 'Regular',
  4: 'Good',
  5: 'Excellent',
};
