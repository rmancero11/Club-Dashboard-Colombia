'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

interface DestinationCardProps {
  destino: any;
}

export default function DestinationCard({ destino }: DestinationCardProps) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("dashboard-user/match-viajes");
  };

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

        {destino.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{destino.description}</p>
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
