"use client";

import { useEffect, useState } from "react";
import UserProfile from "@/app/components/UserProfile";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("No se pudo obtener usuario");
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

  if (loading) return <p>Cargando...</p>;
  if (!user) return <p>No se encontró usuario</p>;

  return <UserProfile user={user} />;
}