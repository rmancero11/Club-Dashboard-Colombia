"use client";

import React, { useEffect, useState } from "react";
import AvatarModalMatchView from "@/app/components/AvatarModalMatchView";
import type { TravelerDTO } from "@/app/types/destination";
import { useParams } from "next/navigation";

export default function MatchProfilePage() {
  const params = useParams();
  const rawId = params.id;
  const matchId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userData, setUserData] = useState<TravelerDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    console.log("MATCH ID:", matchId);

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${matchId}`, { cache: "no-store" });

        if (!res.ok) {
          console.error("ERROR FETCH:", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log("DATA CRUDA API:", data);

        // 🔥 Ajustá esta línea según tu API real
        setUserData(data.user ?? data.data ?? data);
      } catch (err) {
        console.error("Error al obtener datos del match:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [matchId]);

  if (loading) {
    return <p className="text-center mt-20">Cargando perfil...</p>;
  }

  if (!userData) {
    return (
      <p className="text-gray-500 text-center mt-20">
        No se encontró el perfil del viajero con ID: {matchId}.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AvatarModalMatchView
        isOpen={true}
        user={userData}
        onClose={() => window.history.back()}
        fromChat={true}
      />

      <div className="fixed top-4 left-4 z-[9999]">
        <button
          onClick={() => window.history.back()}
          className="bg-purple-600/80 hover:bg-purple-700/80 text-white font-bold px-4 py-2 rounded-full shadow-lg"
        >
          ← Volver al chat
        </button>
      </div>
    </div>
  );
}
