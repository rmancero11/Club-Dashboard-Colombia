"use client"

import { useState } from "react"
import { User } from "@/app/types/user"

interface Props {
  user: User
}

export default function UserProfile({ user }: Props) {
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user.avatar ?? "/images/default-avatar.png"
  )
  const [loading, setLoading] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      setLoading(true)
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Error al subir avatar")
      const data = await res.json()
      setAvatarPreview(data.user.avatar) // URL real desde la API
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center md:flex-row md:items-start gap-6">
        {/* Avatar con upload */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <img
            src={avatarPreview}
            alt={user.name ?? "User profile"}
            className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
          />
          <label
            htmlFor="avatar-upload"
            className="mt-3 text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer"
          >
            {loading ? "Subiendo..." : "Cambiar foto"}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Info principal */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
          <p className="text-gray-600">{user.email}</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-800">{user.phone ?? "No especificado"}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">País</p>
              <p className="font-medium text-gray-800">{user.country ?? "No especificado"}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Presupuesto</p>
              <p className="font-medium text-gray-800">{user.budget ?? "No especificado"}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Preferencia</p>
              <p className="font-medium text-gray-800">{user.preference ?? "No especificado"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones futuras */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
          Aquí irán los agentes del viaje ✈️
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
          Aquí irán los destinos 🌍
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500 md:col-span-2">
          Aquí se mostrarán otros usuarios con su foto y nombre 👥
        </div>
      </div>
    </div>
  )
}
