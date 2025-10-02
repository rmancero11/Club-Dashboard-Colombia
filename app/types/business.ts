import { Customer } from "@prisma/client";


export interface Feedback {
  businessName?: string;
  averageTicket: string;
  creationDate: Date;
  dinners: string;
  email: string;
  fullName: string;
  improve?: string[];
  improveText?: string;
  origin: string;
  phoneNumber?: string;
  rating: number;
  visits?: number;
  startTime: Date;
  acceptPromotions: boolean;
  birthdayDate?: Date;
  attendedBy?: string;
  experienceText?: string;
  feedbackType?: string;
}

export interface FeedbackHooters {
  businessName?: string;
  creationDate: Date;
  email: string;
  fullName: string;
  phoneNumber?: string;
  origin: string;
  startTime: Date;
  acceptPromotions: boolean;
  birthdayDate?: Date;
  attendedBy?: string;
  ambience: number;
  courtesy: number;
  climate: number;
  experience: number;
  foodQuality: number;
  latelySeen: number;
  placeCleanness: number;
  quickness: number;
  recommending: boolean;
  recommendingText: string;
  spending: number;
  waiterService: number;
  comeBack: boolean;
  comeBackText: string;
  improve?: string[];
  improveText?: string;
  visits?: number;
  feedbackType?: string;
}

export interface FeedbackGus {
  businessName?: string;
  creationDate: Date;
  email: string;
  fullName: string;
  origin: string;
  name: string;
  startTime: Date;
  acceptPromotions: boolean;
  birthdayDate?: Date;
  attendedBy?: string;
  treatment: number;
  reception: boolean;
  receptionText: string;
  productTaste: number;
  cashServiceSpeed: number;
  productDeliverySpeed: number;
  placeCleanness: number;
  satisfaction: number;
  recommending: boolean;
  recommendingText: string;
  comeBack: boolean;
  comeBackText: string;
  latelySeen: number;
  spending: number;
  waiterService: number;
  improve?: string[];
  improveText?: string;
  visits?: number;
}

export interface Branch {
  id: string;
  address: string;
  icono: string;
  mapsUrl: string;
  name: string;
  meseros?: Waiter[];
  cover: string;
  iconoWhite: string;
  country: string;
  waiters?: WaiterI[];
  feedbacks?: Feedback[];
  customers?: Customer[];
  pricePlan: number;
  geopoint?: { lat: number; lng: number }; 
}

export interface Business {
  parentId?: string;
  meseros?: WaiterI[];
  id?: string;
  address: string;
  icono: string;
  mapsUrl: string;
  name: string;
  cover: string;
  iconoWhite: string;
  country: string;
  branches?: Branch[];
  waiters?: WaiterI[];
  feedbacks?: Feedback[];
  customers?: Customer[];
  pricePlan: number;
  geopoint?: { lat: number; lng: number };
  socialMedia?: {}[];
  sessionId?: string;
  sucursales?: Branch[];
}

export interface Client {
  feedback: Feedback;
  visits: number;
  hasGoogleReview: boolean;
  businessName?: string;
  phoneNumber?: string;
  acceptPromotions?: boolean;
}

export interface Feedback {
  id: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  customerId: string;
  waiterId?: string;
}

export interface Waiter {
  id: string;
  name: string;
  businessName: string;
  ratingAverage: number;
  gender: string;
  createdAt: Date;
  businessId: string;
  branchId?: string;
  sucursalId?: string;
  sucursal?: Branch;
  numberOfSurveys?: number;
  numberOfFeedbackPerRating?: { [rating: number]: number };
}

export type ImproveAdapted = {
  value: number;
  name: string;
};

export type OriginAdapted = {
  value: number;
  name: string;
};

export type VisitsPerDate = {
  value: number;
  name: string;
};


export type GusClient = Client & {
  hasGoogleReview: boolean;
  name: string;
};

export type HootersClient = {
  feedback?: FeedbackHooters;
  hasGoogleReview: boolean;
  acceptPromotions?: boolean;
  businessName?: string;
};

function formattedName(id: string): string {
  return id;
}
export { formattedName };

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