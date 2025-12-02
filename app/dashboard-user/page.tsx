"use client";

import { useCallback, useEffect, useState } from "react";
import UserProfile from "@/app/components/UserProfile";
import TabDestinos from "@/app/components/TabDestinations";
import TabDescubrir from "@/app/components/TabDiscover";
import BottomNav from "@/app/components/BottomNav";
import TravelersMatchList from "./match-viajes/page";
import { useChatStore } from "@/store/chatStore";
import ChatModal from "../components/chat/ChatModal";
import ChatSocketInitializer from "../components/chat/ChatSocketInitializer";
import ChatMessagesPreloader from "../components/chat/ChatMessagesPreloader";


export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("perfil");
  const [nextDestination, setNextDestination] = useState(null);

  // acciones y estado necesarios para el toggle
  const isModalOpen = useChatStore(state => state.isModalOpen);
  const openModal = useChatStore(state => state.openModal);
  const closeModal = useChatStore(state => state.closeModal);
  const setMatches = useChatStore(state => state.setMatches);

  // Función de TOGGLE: usa el estado actual para decidir abrir o cerrar
  const handleToggleChat = () => {
    if (isModalOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  // 2. FUNCIÓN PARA CARGAR CHATS/MATCHES
  // Esta función se pasa al socket para que la llame al conectarse.
  // Usamos useCallback para que el useEffect del socket no se ejecute innecesariamente.
  const onLoadMatches = useCallback(async (userId: string) => {
    const store = useChatStore.getState();
    // Aquí es donde harías tu fetch para obtener la lista inicial de chats/matches
    // Ejemplo de fetch a una API para obtener los matches/conversaciones del usuario:
    try {
      const res = await fetch(`/api/chat/matches`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      
      const matchesData = await res.json();
      // Asume que la data contiene el formato necesario para `setMatches` en tu store
      if (Array.isArray(matchesData)) {
        setMatches(matchesData); 
        console.log(`✅ ${matchesData.length} Chats/Matches cargados.`);
      }

    } catch (error) {
      console.error("Error al cargar los matches:", error);
    }
  }, [setMatches]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // También movemos aquí la carga del próximo destino
  useEffect(() => {
    async function fetchReservation() {
      const res = await fetch("/api/reservations", { credentials: "include" });
      const data = await res.json();
      if (data.reservations?.[0]?.destination) {
        setNextDestination(data.reservations[0].destination);
      }
    }
    fetchReservation();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (!user) return <p>No se encontró usuario</p>;

  // Extraemos el ID del usuario
  const userId = user?.id;

  return (
    <div className="pb-24"> 
      {/* Solo se inicializa si tenemos el ID del usuario */}
      {userId && ( <ChatSocketInitializer userId={userId} onLoadMatches={onLoadMatches} />)}
      {activeTab === "perfil" && <UserProfile user={user} />}
      {activeTab === "destinos" && <TabDestinos nextDestination={nextDestination} />}
      {activeTab === "descubrir" && <TabDescubrir />}
      {activeTab === "personas" && <TravelersMatchList />}
      {isModalOpen && userId && <ChatModal currentUserId={userId} />}
      
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onToggleChat={handleToggleChat}
      />
    </div>
  );
}
