"use client";

import { useEffect, useState } from "react";
import UserProfile from "@/app/components/UserProfile";
import TabDestinos from "@/app/components/TabDestinations";
import TabDescubrir from "@/app/components/TabDiscover";
import BottomNav from "@/app/components/BottomNav";
import TravelersMatchList from "./match-viajes/page";


export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("perfil");
  const [nextDestination, setNextDestination] = useState(null);

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

  return (
    <div className="pb-24"> 
      {activeTab === "perfil" && <UserProfile user={user} />}
      {activeTab === "destinos" && <TabDestinos nextDestination={nextDestination} />}
      {activeTab === "descubrir" && <TabDescubrir />}
      {activeTab === "personas" && <TravelersMatchList />}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
