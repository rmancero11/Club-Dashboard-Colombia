"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Globe2,
  FolderOpen,
  FileCheck2,
  PlaneTakeoff,
  CalendarDays,
} from "lucide-react";

interface TripDate {
  id: string;
  startDate: string;
  endDate: string;
}

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
  tripDates?: TripDate[];
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

  if (loading)
    return <p className="text-gray-500 font-montserrat">Cargando próxima reserva...</p>;

  if (!reservation)
    return (
      <div className="border rounded-xl p-4 text-gray-600 text-center font-montserrat">
        Aún no tienes una reserva activa.
      </div>
    );

  const { destination, documents } = reservation;

  // 🔹 Traductor de tipos de documento
  const translateDocumentType = (type: string) => {
    const map: Record<string, string> = {
      TRAVEL_TIPS: "Consejos de viaje",
      MEDICAL_ASSISTANCE_CARD: "Asistencia médica",
      PURCHASE_ORDER: "Orden de compra",
      FLIGHT_TICKETS: "Pasajes de vuelo",
      SERVICE_VOUCHER: "Voucher de servicios",
    };
    return map[type] || type.replace(/_/g, " ");
  };

  // 🔹 Formateador de fechas
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // 🔹 Obtiene la primera fecha si existen varias
  const tripDate =
    destination.tripDates && destination.tripDates.length > 0
      ? destination.tripDates[0]
      : null;

  return (
    <div className="border rounded-2xl p-5 bg-purple-50 shadow-sm font-montserrat">
      <h2 className="text-xl font-semibold mb-5 text-purple-700 flex items-center gap-2">
        <PlaneTakeoff className="w-5 h-5 text-purple-600" />
        Tu próxima reserva 
      </h2>

      {/* Contenedor destino */}
      <div className="flex flex-col md:flex-row gap-4 items-center md:items-start mb-5">
        {destination.imageUrl && (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full md:w-48 h-40 object-cover rounded-xl shadow-md border"
          />
        )}

        {/* Texto */}
        <div className="flex flex-col gap-1 text-gray-700 w-full md:w-auto">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
            {destination.name}
          </h3>

          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Globe2 className="w-4 h-4 text-purple-500" />
            {destination.country}
          </p>

          {/* 🔹 Fechas del viaje */}
          {tripDate && (
            <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              {formatDate(tripDate.startDate)} — {formatDate(tripDate.endDate)}
            </p>
          )}

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

      {/* Documentos */}
      <div>
        <h4 className="text-md font-semibold text-purple-700 mb-3 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-purple-600" />
          Documentos de tu reserva
        </h4>

        {documents.length > 0 ? (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex justify-between items-center border rounded-lg p-3 bg-white hover:shadow transition duration-150"
              >
                <div>
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    {translateDocumentType(doc.type)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Subido: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 text-sm font-semibold underline hover:text-purple-900"
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
