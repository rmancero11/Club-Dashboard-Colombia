'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { DestinationDTO } from '@/app/types/destination'

interface DestinationsListProps {
  userDestino?: string
}

export default function DestinationsList({ userDestino }: DestinationsListProps) {
  const [destinos, setDestinos] = useState<DestinationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  useEffect(() => {
    const fetchDestinos = async () => {
      setLoading(true)
      setError(null)

      try {
        // Si quieres traer solo los activos puedes agregar ?active=true
        const res = await fetch('/api/destination', { cache: 'no-store' })
        if (!res.ok) throw new Error('Error al cargar destinos')

        const { items } = await res.json()
        let sorted: DestinationDTO[] = items

        // Filtrado por nombre si userDestino está definido
        if (userDestino) {
          sorted = sorted.sort((a, b) => {
            const aMatch = normalize(a.name).includes(normalize(userDestino))
            const bMatch = normalize(b.name).includes(normalize(userDestino))
            if (aMatch && !bMatch) return -1
            if (!aMatch && bMatch) return 1
            return 0
          })
        }

        // Limitar a máximo 6 destinos
        setDestinos(sorted.slice(0, 6))
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchDestinos()
  }, [userDestino])

  if (loading) return <p className="text-gray-500 text-center mt-4">Cargando destinos...</p>
  if (error) return <p className="text-red-500 text-center mt-4">⚠️ {error}</p>
  if (destinos.length === 0) return <p className="text-gray-400 text-center mt-4">No hay destinos disponibles</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {destinos.map((destino) => (
        <div
          key={destino.id}
          className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
        >
          <div className="relative w-full h-48">
            <Image
              src={destino.imageUrl || '/images/placeholder.jpg'}
              alt={destino.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{destino.name}</h2>
            <p className="text-sm text-gray-500 mb-2">
              {destino.city ? `${destino.city}, ${destino.country}` : destino.country}
            </p>
            {destino.description && (
              <p className="text-gray-600 mb-3 line-clamp-2">{destino.description}</p>
            )}

            {destino.category && (
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                {destino.category}
              </span>
            )}

            <div className="mt-3">
              <p className="text-purple-600 font-bold">
                Popularidad: {destino.popularityScore?.toFixed(1) || 0}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
