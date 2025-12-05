import React from "react";
import AvatarModalMatchView from "@/app/components/AvatarModalMatchView"; 
import type { TravelerDTO } from "@/app/types/destination";

// Definición de tipos para los parámetros de la página
interface MatchProfilePageProps {
  params: {
    id: string; // El ID del match que se obtiene de la URL
  };
}

// ------------------------------------------------------------------------
// FUNCIÓN PARA OBTENER LOS DATOS DEL USUARIO (simulación de fetch a la API)
// ------------------------------------------------------------------------
async function getMatchData(userId: string): Promise<TravelerDTO | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}`, {
      cache: 'no-store', // Para asegurar que siempre obtenga la información más reciente
    });

    if (!res.ok) {
      console.error(`Error fetching user ${userId}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data.user as TravelerDTO; // Asume que la respuesta tiene una propiedad 'user'
    
  } catch (error) {
    console.error("Error al obtener datos del match:", error);
    return null;
  }
}

// ------------------------------------------------------------------------
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ------------------------------------------------------------------------
export default async function MatchProfilePage({ params }: MatchProfilePageProps) {
  const matchId = params.id;

  if (!matchId) {
    return <p className="text-red-500 text-center mt-20">Error: ID del match no proporcionado.</p>;
  }

  const userData = await getMatchData(matchId);

  if (!userData) {
    return <p className="text-gray-500 text-center mt-20">No se encontró el perfil del viajero con ID: {matchId}.</p>;
  }

  // ----------------------------------------------------------------------
  // RENDERIZADO DEL MODAL COMO VISTA DE PÁGINA COMPLETA
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* El componente AvatarModalMatchView se usa aquí como la vista principal de la página.
        - isOpen: Se fuerza a 'true' porque es una página que debe estar visible.
        - onClose: Se deja vacío o se le asigna una función que redirija al usuario
                   a la página anterior (history.back()) o a la lista de chats.
        - onNextUser: Se quita o se deja como undefined ya que no tiene sentido
                      pasar al 'siguiente usuario' en una vista de perfil específica.
      */}
      <AvatarModalMatchView
        isOpen={true} // Obligatoriamente visible
        onClose={() => { 
            // Esto redirigirá al usuario a la página anterior, 
            // que probablemente sea el chat o la lista de matches.
            if (typeof window !== 'undefined') {
                window.history.back(); 
            }
        }}
        user={userData}
        // onNextUser={undefined} // No se necesita aquí
      />
      
      {/* Si prefieres usar un botón para volver: */}
      <div className="fixed top-4 left-4 z-[9999]">
         <button 
             onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
             className="bg-purple-600/80 hover:bg-purple-700/80 text-white font-bold px-4 py-2 rounded-full shadow-lg"
         >
             ← Volver al chat
         </button>
      </div>
    </div>
  );
}