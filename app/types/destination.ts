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
  createdAt: string; // o Date si lo parseas
  updatedAt: string;
  imageUrl: string;
}
