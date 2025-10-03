// DestinosList.tsx
"use client"

import { useEffect, useState } from "react"
import { Destino } from "@/app/types/destino"

interface DestinosListProps {
  userDestino: string
}

export default function DestinosList({ userDestino }: DestinosListProps) {
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [loading, setLoading] = useState(true)

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

  useEffect(() => {
    const fetchDestinos = async () => {
      try {
        const res = await fetch("/api/destinos")
        if (!res.ok) throw new Error("Error al cargar destinos")
        const data: Destino[] = await res.json()

        const sorted = data.sort((a, b) => {
          const aMatch = normalize(a.nombre).includes(normalize(userDestino))
          const bMatch = normalize(b.nombre).includes(normalize(userDestino))

          if (aMatch && !bMatch) return -1
          if (!aMatch && bMatch) return 1
          return 0
        })

        setDestinos(sorted)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDestinos()
  }, [userDestino]) // importante: si cambia el destino del usuario, reordena

  if (loading) return <p className="text-gray-500">Cargando destinos...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {destinos.map((destino) => (
        <div
          key={destino.id}
          className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
        >
          <img
            src={destino.imagen}
            alt={destino.nombre}
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {destino.nombre}
            </h2>
            <p className="text-gray-600 mt-1">{destino.descripcion}</p>
            <p className="text-purple-600 font-bold mt-2">${destino.precio}</p>
            <p className="text-sm text-gray-500 mt-2">
              Incluye: {destino.incluidos}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
