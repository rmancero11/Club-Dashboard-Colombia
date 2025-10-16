"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  destino?: string | null;
  avatar?: string | null;
  dniFile?: string | null;
  passportFile?: string | null;
  visaFile?: string | null;
  purchaseOrder?: string | null;
  flightTickets?: string | null;
  serviceVoucher?: string | null;
  medicalAssistanceCard?: string | null;
  travelTips?: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [dniFile, setDniFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.user) {
          setUser({
            ...data.user,
            passportFile: data.user.passport ?? null,
            visaFile: data.user.visa ?? null,
          });
          setForm({
            name: data.user.name || "",
            email: data.user.email || "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    if (dniFile) formData.append("dni", dniFile);
    if (passportFile) formData.append("passport", passportFile);
    if (visaFile) formData.append("visa", visaFile);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          ...data.user,
          passportFile: data.user.passport ?? null,
          visaFile: data.user.visa ?? null,
        });
        setSuccess(true);
      } else {
        console.error("Error updating user");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileList = [
    { label: "DNI", url: user?.dniFile },
    { label: "Pasaporte", url: user?.passportFile },
    { label: "Visa", url: user?.visaFile },
    { label: "Orden de compra", url: user?.purchaseOrder },
    { label: "Boletos de vuelo", url: user?.flightTickets },
    { label: "Voucher de servicio", url: user?.serviceVoucher },
    { label: "Tarjeta de asistencia médica", url: user?.medicalAssistanceCard },
    { label: "Tips de viaje", url: user?.travelTips },
  ];

  if (!user) return <p className="text-center mt-10">Cargando perfil...</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Editar perfil</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div className="flex justify-center mb-4 md:justify-start">
            <Image
              src={user.avatar || "/images/default-avatar.png"}
              alt={user.name || "Avatar del usuario"}
              width={120}
              height={120}
              className="rounded-full border-4 border-purple-500 object-cover"
            />
          </div>

          <p className="text-gray-600 font-medium">
            Teléfono:{" "}
            <span className="font-normal">
              {user.phone ?? "No especificado"}
            </span>
          </p>
          <p className="text-gray-600 font-medium">
            País:{" "}
            <span className="font-normal">
              {user.country ?? "No especificado"}
            </span>
          </p>
          <p className="text-gray-600 font-medium">
            Destino de interés:{" "}
            <span className="font-normal">
              {user.destino ?? "No especificado"}
            </span>
          </p>

          {/* Ver archivos subidos */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFiles(!showFiles)}
              className="w-full text-left px-4 py-2 bg-purple-100 text-purple-800 font-medium rounded-md hover:bg-purple-200"
            >
              {showFiles ? "Ocultar archivos subidos" : "Ver archivos subidos"}
            </button>
            {showFiles && (
              <div className="mt-2 grid grid-cols-1 gap-3">
                {fileList.map((file) => (
                  <div
                    key={file.label}
                    className="bg-white rounded-lg shadow p-3 flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {file.label}
                    </span>
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No subido</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700 font-medium">Nombre</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </label>

          {/* Archivos */}
          <label className="block">
            <span className="text-gray-700 font-medium">DNI</span>
            <input
              type="file"
              onChange={(e) => setDniFile(e.target.files?.[0] || null)}
              className="w-full mt-1 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Pasaporte</span>
            <input
              type="file"
              onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
              className="w-full mt-1 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Visa</span>
            <input
              type="file"
              onChange={(e) => setVisaFile(e.target.files?.[0] || null)}
              className="w-full mt-1 text-sm"
            />
          </label>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition disabled:bg-purple-300"
            >
              {loading ? "Guardando..." : "Guardar archivos"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard-user")}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
            >
              Volver
            </button>
          </div>

          {success && (
            <p className="text-green-600 font-medium text-center mt-2">
              Datos actualizados correctamente ✅
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
