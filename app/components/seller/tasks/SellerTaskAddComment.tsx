"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerTaskAddComment({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/seller/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo agregar el comentario.");
      }

      setText(""); // limpiar el campo al guardar
      router.refresh();
    } catch (err: any) {
      alert(err?.message ?? "Error al agregar el comentario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe una nota…"
        className="rounded-md border px-3 py-2 text-sm"
        disabled={loading}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Agregando…" : "Agregar comentario"}
        </button>
        <button
          type="button"
          onClick={() => setText("")}
          disabled={loading}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
