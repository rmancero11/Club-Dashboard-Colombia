import { User } from "@/app/types/user"

interface Props {
  user: User
}

export default function UserProfile({ user }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Encabezado del perfil */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center md:flex-row md:items-start gap-6">
        {/* Imagen de perfil (placeholder mientras no tengas subida real) */}
        <div className="flex-shrink-0">
          <img
            src="https://i.pravatar.cc/150?img=5"
            alt={user.name ?? "User profile"}
            className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
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

      {/* Espacios para futuras secciones */}
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
