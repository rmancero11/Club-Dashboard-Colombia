"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

type Destination = {
  id: string;
  name: string;
};

type Props = {
  gustosIniciales: string[];
  destinosIniciales: string[];
  onSave: (data: { gustos: string[]; destinos: string[] }) => Promise<void>;
};

const opcionesGustos = ["Playa", "Aventura", "Cultura"];

export default function UserPreferences({
  gustosIniciales,
  destinosIniciales,
  onSave,
}: Props) {
  const [editando, setEditando] = useState<"gustos" | "destinos" | null>(null);
  const [gustos, setGustos] = useState<string[]>([]);
  const [destinos, setDestinos] = useState<string[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<
    Destination[]
  >([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Si incluye "Mixtos", asignar automáticamente los tres gustos
  useEffect(() => {
    if (gustosIniciales.some((g) => g.toLowerCase() === "mixto")) {
      setGustos(opcionesGustos);
    } else {
      setGustos(gustosIniciales);
    }
  }, [gustosIniciales]);

  useEffect(() => setDestinos(destinosIniciales), [destinosIniciales]);

  useEffect(() => {
    async function fetchDestinos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/destination", { cache: "no-store" });
        if (!res.ok) throw new Error("Error al cargar destinos");
        const { items } = await res.json();
        setAvailableDestinations(
          items.map((d: any) => ({ id: d.id, name: d.name }))
        );
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchDestinos();
  }, []);

  const toggleGusto = (valor: string) => {
    setGustos((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
    );
  };

  const toggleDestino = (valor: string) => {
    setDestinos((prev) => {
      if (prev.includes(valor)) return prev.filter((v) => v !== valor);
      if (prev.length >= 3) return prev;
      return [...prev, valor];
    });
  };

  const handleGuardar = async () => {
    try {
      await onSave({ gustos, destinos });
      setEditando(null);
      setDropdownOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar");
    }
  };

  return (
    <div className="mt-5 w-full text-left font-montserrat">
      {/* DESTINOS */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 mb-2 font-montserrat">
            Destinos de interés
          </h2>
          <button
            onClick={() =>
              setEditando(editando === "destinos" ? null : "destinos")
            }
            className="text-sm text-primary hover:underline font-montserrat"
          >
            {editando === "destinos" ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editando === "destinos" ? (
          <div className="relative flex flex-col">
            <div
              className="border border-gray-300 rounded-lg p-2 cursor-pointer font-montserrat"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {destinos.length > 0
                ? destinos.join(", ")
                : "Selecciona hasta 3 destinos"}
            </div>

            {dropdownOpen && (
              <div className="mt-2 border border-gray-300 rounded-lg bg-white w-full z-10 max-h-48 overflow-auto shadow-lg">
                {loading ? (
                  <p className="p-2 text-gray-500 font-montserrat">
                    Cargando...
                  </p>
                ) : error ? (
                  <p className="p-2 text-red-500 font-montserrat">⚠️ {error}</p>
                ) : availableDestinations.length === 0 ? (
                  <p className="p-2 text-gray-400 font-montserrat">
                    No hay destinos disponibles
                  </p>
                ) : (
                  availableDestinations.map((d) => (
                    <label
                      key={d.id}
                      className={`flex items-center gap-2 p-2 text-gray-700 cursor-pointer hover:bg-purple-100 font-montserrat ${
                        destinos.includes(d.name) ? "bg-purple-200" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={destinos.includes(d.name)}
                        readOnly
                        onClick={() => toggleDestino(d.name)}
                        className="accent-purple-600"
                      />
                      <span className="font-montserrat">{d.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            <button
              onClick={handleGuardar}
              className="mt-2 bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 self-start font-montserrat"
            >
              Guardar cambios
            </button>
          </div>
        ) : destinos.length > 0 ? (
          <ul
            className="grid gap-3 text-sm text-gray-600 
                         grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {destinos.map((d, i) => (
              <li
                key={i}
                className="inline-flex justify-center items-center 
                           bg-gray-100 rounded-full px-4 py-2 text-center 
                           break-words max-w-full shadow-sm hover:shadow-md transition-shadow font-montserrat"
              >
                {d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm font-montserrat">
            No especificado
          </p>
        )}
      </div>

      {/* GUSTOS */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 mb-2 font-montserrat">
            Tus gustos
          </h2>
          <button
            onClick={() => setEditando(editando === "gustos" ? null : "gustos")}
            className="text-sm text-primary hover:underline font-montserrat"
          >
            {editando === "gustos" ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editando === "gustos" ? (
          <div className="flex flex-col gap-2">
            {opcionesGustos.map((g) => (
              <label
                key={g}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-montserrat"
              >
                <input
                  type="checkbox"
                  checked={gustos.includes(g)}
                  onChange={() => toggleGusto(g)}
                  className="accent-purple-600"
                />
                {g}
              </label>
            ))}
            <button
              onClick={handleGuardar}
              className="mt-3 bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 font-montserrat"
            >
              Guardar cambios
            </button>
          </div>
        ) : gustos.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {opcionesGustos.map((g) => {
              if (!gustos.includes(g)) return null; // Mostrar solo gustos seleccionados
              let icon = "";
              if (g.toLowerCase() === "playa") icon = "/favicon/playa-club-solteros.svg";
              if (g.toLowerCase() === "aventura") icon = "/favicon/aventura-club-solteros.svg";
              if (g.toLowerCase() === "cultura") icon = "/favicon/cultura-club-solteros.svg";

              return (
                <li key={g} className="flex flex-col items-center gap-1 font-montserrat">
                  <Image src={icon} alt={g} width={50} height={50} />
                  <span className="text-xs text-gray-700">{g}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm font-montserrat">
            No especificado
          </p>
        )}
      </div>
    </div>
  );
}
