"use client";

import { useEffect, useState } from "react";

interface ReservationDocument {
  id: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  imageUrl?: string | null;
  description?: string | null;
  price?: string | null;
}

interface Reservation {
  destination: Destination;
  documents: ReservationDocument[];
}

export default function UserNextReservation() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReservation() {
      try {
        const res = await fetch("/api/reservations", { credentials: "include" });
        if (!res.ok) throw new Error("Error al obtener reserva");
        const data = await res.json();
        if (data.reservations?.length > 0) {
          setReservation(data.reservations[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, []);

  if (loading) return <p className="text-gray-500">Cargando próxima reserva...</p>;
  if (!reservation)
    return (
      <div className="border rounded-xl p-4 text-gray-600 text-center">
        Aún no tienes una reserva activa.
      </div>
    );

  const { destination, documents } = reservation;

  return (
    <div className="border rounded-xl p-4 bg-purple-50">
      <h2 className="text-lg font-semibold mb-4 text-purple-700">
        Tu próxima reserva ✈️
      </h2>

      {/* Información del destino */}
      <div className="flex gap-4 items-center mb-4">
        {destination.imageUrl && (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-32 h-24 rounded-lg object-cover border"
          />
        )}
        <div>
          <h3 className="font-bold text-lg">{destination.name}</h3>
          <p className="text-gray-600">{destination.country}</p>
          {destination.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {destination.description}
            </p>
          )}
          {destination.price && (
            <p className="text-purple-700 font-semibold mt-2">
              Precio: {destination.price}
            </p>
          )}
        </div>
      </div>

      {/* Documentos asociados */}
      <div>
        <h4 className="text-md font-semibold text-purple-600 mb-2">
          Documentos de tu reserva
        </h4>
        {documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex justify-between items-center border rounded-lg p-2 bg-white"
              >
                <div>
                  <p className="font-medium">{doc.type}</p>
                  <p className="text-xs text-gray-500">
                    Subido: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 text-sm font-semibold underline"
                >
                  Ver documento
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No hay documentos cargados.</p>
        )}
      </div>
    </div>
  );
}
