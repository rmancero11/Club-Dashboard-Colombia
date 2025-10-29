"use client";
import { useEffect, useState } from "react";

async function askPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  const res = await Notification.requestPermission();
  return res;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushSwitch() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setEnabled(!!sub);
      } catch {
        /* noop */
      }
    })();
  }, []);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);

    try {
      if (!enabled) {
        // ACTIVAR
        const perm = await askPermission();
        if (perm !== "granted") {
          setMsg("Debes permitir las notificaciones.");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        setEnabled(true);
        setMsg("Notificaciones activadas.");
      } else {
        // DESACTIVAR
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        setEnabled(false);
        setMsg("Notificaciones desactivadas.");
      }
    } catch (e: any) {
      setMsg("No se pudo cambiar el estado de notificaciones.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggle}
        disabled={busy}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? "bg-purple-600" : "bg-gray-300"
        } ${busy ? "opacity-70" : ""}`}
        aria-pressed={enabled}
        aria-label="Cambiar notificaciones"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">
        {enabled ? "Notificaciones activadas" : "Notificaciones desactivadas"}
      </span>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  );
}
