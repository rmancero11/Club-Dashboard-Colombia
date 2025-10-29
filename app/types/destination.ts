export interface TravelerDTO {
  id: string;
  name: string | null;
  avatar: string | null;
  country: string | null;
  preference: string[];
  destino: string[];
}

export interface DestinationDTO {
  id: string;
  name: string;
  country: string;
  city?: string | null;
  description?: string | null;
  isActive: boolean;
  popularityScore: number;
  imageUrl?: string | null;
  category?: string | null;
  membership: "STANDARD" | "PREMIUM" | "VIP"; // o los valores de tu enum


  price?: string | null;
  discountPrice?: string | null;
  // 💵 Precios base
  priceUSDWithAirfare?: number | null;
  priceUSDWithoutAirfare?: number | null;
  priceCOPWithAirfare?: number | null;
  priceCOPWithoutAirfare?: number | null;

  // 💰 Listas originales
  listUSDWithAirfare?: number | null;
  listUSDWithoutAirfare?: number | null;
  listCOPWithAirfare?: number | null;
  listCOPWithoutAirfare?: number | null;

  // 🔻 Descuentos
  discountUSDWithAirfarePercent?: number | null;
  discountUSDWithoutAirfarePercent?: number | null;
  discountCOPWithAirfarePercent?: number | null;
  discountCOPWithoutAirfarePercent?: number | null;

  // 🔹 Otros
  baseFromUSD?: number | null;
  baseFromCOP?: number | null;
  travelers?: {
    id: string;
    name?: string | null;
    avatar?: string | null;
    country?: string | null;
  }[];
}


