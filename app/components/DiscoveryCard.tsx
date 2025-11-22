'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, X } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';

// Tipado básico del usuario para la tarjeta
interface TargetUser {
  id: string;
  name: string;
  age: number;
  bio: string;
  avatar: string;
}

interface DiscoveryCardProps {
  targetUser: TargetUser;
  // Función para manejar el éxito del match (activar el modal)
  onMatch: (matchedUser: TargetUser) => void; 
  // Función para pasar al siguiente usuario (sin match)
  onNext: () => void; 
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ targetUser, onMatch, onNext }) => {
  const { user } = useAuth(); // Usamos useAuth para obtener el ID del usuario actual

  const currentUserId = user?.id;
  
  // No renderizar si no hay usuario logueado
  if (!currentUserId) {
    return null; 
  }

  // --- Lógica principal de "LIKE" ---
  const handleLike = async () => {
    const response = await fetch('/api/match/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Sólo enviamos toUserId, el fromUserId se obtiene de forma segura en el backend
      body: JSON.stringify({ toUserId: targetUser.id }), 
    });

    if (response.ok) {
      const data = await response.json();

      if (data.matched) {
        // Hubo match mutuo! Activamos el modal a través del callback
        onMatch(targetUser); 
      }
      // Pasa al siguiente usuario, independientemente del resultado
      onNext();
    } else {
      // Error al enviar like
      const errorData = await response.json();
      console.error('Error al dar Like:', errorData.error);
      alert(`No se pudo enviar el like: ${errorData.error}`);
    }
  };

  // --- Lógica de "UNLIKE" ---
  const handleDislike = async () => {
    try {
      const response = await fetch('api/match/unlike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUser.id }),
      });

      if (!response.ok || response.status === 403) {
        console.error(`Error al hacer unlike: ${response.status}`);
      }
      // Pasamos al siguiente usuario de la lista
      onNext();
    } catch (error) {
      console.error('Error de red al hacer unlike:', error);
      onNext(); // Aseguramos que el usuario pueda seguir navegando
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-sm">
      
      {/* IMAGEN DE PERFIL */}
      <div className="relative h-80">
        <Image 
          src={targetUser.avatar} 
          alt={targetUser.name} 
          fill 
          className="object-cover" 
          sizes="(max-width: 640px) 100vw, 384px"
        />
      </div>

      {/* INFORMACIÓN DEL USUARIO */}
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {targetUser.name}, <span className="font-normal text-gray-600">{targetUser.age}</span>
        </h2>
        <p className="text-gray-500 mt-2 line-clamp-3">{targetUser.bio || "No hay biografía disponible."}</p>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-around p-4 border-t">
        
        {/* Dislike/Skip Button */}
        <button 
          onClick={handleDislike}
          className="p-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition duration-150 shadow-md active:scale-95"
          title="Saltar o No me gusta"
        >
          <X className="w-8 h-8" strokeWidth={3} />
        </button>

        {/* Like Button */}
        <button 
          onClick={handleLike}
          className="p-4 rounded-full bg-green-100 text-green-500 hover:bg-green-200 transition duration-150 shadow-md active:scale-95"
          title="Me gusta"
        >
          <Heart className="w-8 h-8 fill-green-500" />
        </button>
      </div>

    </div>
  );
};

export default DiscoveryCard;