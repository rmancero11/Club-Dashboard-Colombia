export interface TravelerDTO {
  id: string;
  name: string | null;
  avatar: string | null;
  country: string | null;
  preferences: string | null;
}

export interface DestinationDTO {
  id: string;
  businessId: string;
  name: string;
  country: string;
  city?: string | null;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
  popularityScore: number;
  createdAt: string; 
  updatedAt: string;
  imageUrl: string;
  price: number | null; 
  discountPrice?: number | null;
  travelers?: TravelerDTO[]; 
}

