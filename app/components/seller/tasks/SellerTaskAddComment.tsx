"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerTaskAddComment({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const body = { text: text.trim() };
    if (!body.text) return;
    setLoading(true);
    const res = await fetch(`/api/seller/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo agregar el comentario.");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe una nota…"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="rounded-md bg-black px-4 py-2 text-white text-sm"
        >
          {loading ? "Agregando…" : "Agregar comentario"}
        </button>
        <button
          type="button"
          onClick={() => setText("")}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
