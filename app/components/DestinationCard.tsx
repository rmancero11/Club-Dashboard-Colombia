"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface Category {
  id: string;
  name: string;
}

interface TripDate {
  id: string;
  startDate: string;
  endDate: string;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  city?: string;
  imageUrl?: string | null;
  description?: string | null;
  categories?: { id: string; name: string }[];
  tripDates?: (TripDate | string)[];
}

interface DestinationCardProps {
  destino: Destination;
}

export default function DestinationCard({ destino }: DestinationCardProps) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("dashboard-user/match-viajes");
  };

  // 🔹 Función para determinar color de categoría
  const getCategoryColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "playa":
        return "bg-yellow-100 text-yellow-700";
      case "aventura":
        return "bg-green-100 text-green-700";
      case "cultura":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // 🔹 Formatear fecha (ej: "15 Ene 2026")
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // 🔹 Tomar la primera fecha de viaje (la más próxima)
  // Tomar la primera fecha
const nextTrip =
  destino.tripDates && destino.tripDates.length > 0
    ? destino.tripDates[0]
    : null;

// Verificar si es un objeto con startDate y endDate
const isTripObject =
  nextTrip && typeof nextTrip === "object" && "startDate" in nextTrip && "endDate" in nextTrip;

  return (
    <div className="flex-shrink-0 w-72 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 bg-white flex flex-col justify-between">
      {/* Imagen */}
      <div className="relative w-full h-48">
        <Image
          src={destino.imageUrl || "/images/placeholder.jpg"}
          alt={destino.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-grow gap-2">
        <h2 className="text-xl font-semibold text-gray-800">{destino.name}</h2>
        <p className="text-sm text-gray-500">
          {destino.city ? `${destino.city}, ${destino.country}` : destino.country}
        </p>

        {/* Categorías */}
        {destino.categories && destino.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {destino.categories.map((cat) => (
              <span
                key={cat.id}
                className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${getCategoryColor(cat.name)}`}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Fechas de viaje */}
{isTripObject && (
  <div className="text-sm text-gray-600 mb-1">
    <span className="font-medium text-gray-800">
      📅 {formatDate((nextTrip as any).startDate)}
    </span>{" "}
    → <span>{formatDate((nextTrip as any).endDate)}</span>
  </div>
)}
      </div>

      {/* Botón */}
      <div className="p-4 flex justify-center">
        <button
          onClick={handleRedirect}
          className="bg-primary hover:bg-primary text-white font-medium py-2 px-4 rounded-full transition duration-200"
        >
          Conocé viajeros
        </button>
      </div>
    </div>
  );
}
