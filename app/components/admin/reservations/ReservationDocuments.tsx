"use client";

import { useState, useEffect } from "react";

interface ReservationDocument {
  id: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: { name?: string };
}

export default function ReservationDocuments({ reservationId }: { reservationId: string }) {
  const [documents, setDocuments] = useState<ReservationDocument[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧠 Cargar documentos existentes
 useEffect(() => {
  async function fetchDocs() {
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/documents`);
      const data = await res.json();
      console.log("📄 [DEBUG] fetch documents response:", data);
      if (res.ok) setDocuments(data.documents ?? []);
      else alert(data.error || "Error cargando documentos");
    } catch (err) {
      console.error(err);
      alert("Error cargando documentos");
    }
  }
  fetchDocs();
}, [reservationId]);

  // 📤 Subir documentos nuevos
  async function handleUpload(e: React.FormEvent) {
  e.preventDefault();
  if (!files?.length || !type) return alert("Selecciona tipo y archivo(s)");

  const formData = new FormData();
  formData.append("type", type);
  for (const f of Array.from(files)) formData.append("files", f);

  setLoading(true);
  try {
    const res = await fetch(`/api/admin/reservations/${reservationId}/documents`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      // Reemplazar documentos viejos del mismo tipo
      setDocuments((prev) => [
        ...prev.filter((doc) => doc.type !== type), // elimina el viejo del mismo tipo
        ...data.documents, // agrega el nuevo
      ]);

      setFiles(null);
      setType("");
    } else {
      alert(data.error || "Error subiendo documentos");
    }
  } catch (err) {
    console.error(err);
    alert("Error subiendo documentos");
  } finally {
    setLoading(false);
  }
}


  // ❌ Eliminar documento
  // ❌ Eliminar documento
async function handleDelete(id: string) {
  // Confirmación antes de borrar
  const confirmed = window.confirm("¿Eliminar este documento?");
  if (!confirmed) return;

  try {
    const res = await fetch(
      `/api/admin/reservations/${reservationId}/documents?id=${id}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!res.ok) {
      // Mostrar error del servidor
      alert(data.error || "Error eliminando documento");
      return;
    }

    // Actualizar la lista de documentos en el front
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    alert("Documento eliminado correctamente");
  } catch (err) {
    console.error("❌ Error eliminando documento:", err);
    alert("Error eliminando documento");
  }
}

 return (
  <div className="space-y-4">
    {/* Contenedor con borde y título */}
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Documentos de la reserva</h2>

      {/* Formulario de subida */}
      <form onSubmit={handleUpload} className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded-md p-2 text-sm"
        >
          <option value="">Seleccionar tipo</option>
          <option value="PURCHASE_ORDER">Orden de compra</option>
          <option value="FLIGHT_TICKETS">Boletos aéreos</option>
          <option value="SERVICE_VOUCHER">Voucher de servicio</option>
          <option value="MEDICAL_ASSISTANCE_CARD">Asistencia médica</option>
          <option value="TRAVEL_TIPS">Tips de viaje</option>
        </select>

        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Subiendo..." : "Subir"}
        </button>
      </form>

      {/* Lista de documentos */}
      {documents.length === 0 ? (
        <p className="text-sm text-gray-400">No hay documentos aún.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex justify-between items-center border rounded-md p-2 text-sm"
            >
              <div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {doc.type.replace(/_/g, " ")}
                </a>{" "}
                <span className="text-gray-500">
                  · {new Date(doc.uploadedAt).toLocaleDateString("es-CO")}
                  {doc.uploadedBy?.name ? ` · ${doc.uploadedBy.name}` : ""}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
}
