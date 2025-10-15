'use client';

import Image from "next/image";

interface DestinationCardProps {
  destino: any; // <- aquí podés poner cualquier cosa sin que TypeScript se queje
}

export default function DestinationCard({ destino }: DestinationCardProps) {
  return (
    <div className="flex-shrink-0 w-72 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 bg-white">
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
      <div className="p-5 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-800">{destino.name}</h2>
        <p className="text-sm text-gray-500">
          {destino.city ? `${destino.city}, ${destino.country}` : destino.country}
        </p>

        {destino.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{destino.description}</p>
        )}

        {/* Precios */}
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          {destino.discountPrice ? (
            <>
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-md line-through">
                ${Number(destino.price).toLocaleString()}
              </span>
              <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-md">
                ${Number(destino.discountPrice).toLocaleString()}
              </span>
            </>
          ) : (
            <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-md">
              ${Number(destino.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
