import { GeoPoint, Timestamp } from 'firebase/firestore';

export type FeedbackPerRating = {
  [key: number]: number;
};

export interface Feedback {
  BusinessName?: string;
  AverageTicket: string;
  CreationDate: Timestamp;
  Dinners: string;
  Email: string;
  FullName: string;
  Improve?: string[];
  ImproveText?: string;
  Origin: string;
  PhoneNumber?: string;
  Rating: number;
  Visits?: number;
  StartTime: Timestamp;
  AcceptPromotions: boolean;
  BirthdayDate?: Timestamp;
  AttendedBy?: string;
  ExperienceText?: string;
  FeedbackType?: string;
}

export interface FeedbackHooters {
  BusinessName?: string;
  CreationDate: Timestamp;
  Email: string;
  FullName: string;
  PhoneNumber?: string;
  Origin: string;
  StartTime: Timestamp;
  AcceptPromotions: boolean;
  BirthdayDate?: string;
  AttendedBy?: string;
  Ambience: number;
  Courtesy: number;
  Climate: number;
  Experience: number;
  FoodQuality: number;
  LatelySeen: number;
  PlaceCleanness: number;
  Quickness: number;
  Recommending: boolean;
  RecommendingText: string;
  Spending: number;
  WaiterService: number;
  ComeBack: boolean;
  ComeBackText: string;
  Improve?: string[];
  ImproveText?: string;
  Visits?: number;
  FeedbackType?: string;
}

export interface FeedbackGus {
  BusinessName?: string;
  CreationDate: Timestamp;
  Email: string;
  FullName: string;
  Origin: string;
  StartTime: Timestamp;
  AcceptPromotions: boolean;
  BirthdayDate?: Timestamp;
  AttendedBy?: string;
  Treatment: number;
  Reception: boolean;
  ReceptionText: string;
  ProductTaste: number;
  CashServiceSpeed: number;
  ProductDeliverySpeed: number;
  PlaceCleanness: number;
  Satisfaction: number;
  Recommending: boolean;
  RecommendingText: string;
  ComeBack: boolean;
  ComeBackText: string;
  LatelySeen: number;
  Spending: number;
  WaiterService: number;
  Improve?: string[];
  ImproveText?: string;
  Visits?: number;
}

export const colorByFeedback = (feedback: string) => {
  switch (feedback) {
    case 'Comida':
      return '#FBF2EF';
    case 'Servicio':
      return '#D0D8EA';
    default:
      return '#CBEFD2';
  }
};

export interface Waiter {
  id: string;
  sucursalId: string;
  name: string;
  gender: string;
  numberOfSurveys: number;
  ratingAverage?: number;
  latestSum?: number;
  feedbacks?: (Feedback | FeedbackHooters)[];
  customers?: Customer[];
  numberOfFeedbackPerRating: FeedbackPerRating;
  businessName?: string;
  sucursal?: Branch;
}

export interface Branch {
  Id: string;
  Address: string;
  Icono: string;
  MapsUrl: string;
  Name: string;
  Cover: string;
  IconoWhite: string;
  Country: 'CO' | 'EC' | 'MX' | 'US' | 'AR' | 'CA' | 'DO' | 'HN';
  Waiter?: Waiter;
  Waiters?: Waiter[];
  feedbacks?: (Feedback | FeedbackHooters)[];
  customers?: Customer[];
  PricePlan: number;
  meseros?: Waiter[];
  Geopoint?: GeoPoint;
}

export interface Customer {
  name: string;
  email: string;
  phoneNumber?: string;
  birthdayDate?: string;
  feedbacks: (Feedback | FeedbackHooters)[];
}

export interface Business {
  parentId?: string;
  Id?: string;
  Address: string;
  Icono: string;
  MapsUrl: string;
  Name: string;
  Cover: string;
  IconoWhite: string;
  Country:
    | 'CO'
    | 'EC'
    | 'MX'
    | 'US'
    | 'AR'
    | 'CA'
    | 'DO'
    | 'HN'
    | 'GT'
    | 'ES'
    | 'IT';
  sucursales?: Branch[];
  meseros?: Waiter[];
  Waiter?: Waiter;
  feedbacks?: (Feedback | FeedbackHooters)[];
  customers?: Customer[];
  PricePlan: number;
  Geopoint?: GeoPoint;
  SocialMedia?: {}[];
  sessionId?: string
}

export type BusinessAssets = {
  iconUrl: string;
  coverUrl: string;
};

export type BusinessData = {
  loading: boolean;
  businessData: Business | null;
};

// adapters
export type ImproveAdapted = {
  value: number;
  name: string;
};

export type BaseClient<T> = {
  feedback: T;
  visits: number;
  hasGoogleReview: boolean;
  businessName?: string;
  phoneNumber?: string;
  acceptPromotions?: boolean;
};

export type Client = BaseClient<Feedback>;
export type HootersClient = BaseClient<FeedbackHooters>;
export type GusClient = BaseClient<FeedbackGus>;
export type PremiumBusinessClient = BaseClient<FeedbackHooters | FeedbackGus>;

export type OriginAdapted = {
  value: number;
  name: string;
};

export type VisitsPerDate = {
  value: number;
  name: string;
};
