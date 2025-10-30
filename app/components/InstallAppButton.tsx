"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si está en modo standalone (ya instalada)
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );

    // Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

    // Capturar el evento antes de la instalación (solo Android/Chrome)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("✅ App instalada correctamente");
    } else {
      console.log("❌ Instalación cancelada");
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Si ya está instalada, no mostrar el botón
  if (isStandalone) return null;

  // 🔹 Caso iOS (Safari): mostrar instrucción manual
  if (isIos) {
    return (
      <div className="fixed bottom-5 left-0 right-0 mx-auto w-fit bg-white/90 border border-gray-300 px-4 py-2 rounded-lg shadow-md text-sm text-center">
        <p className="text-gray-800">
          Para instalar, toca el <strong>icono de compartir</strong> y luego{" "}
          <strong>“Agregar a pantalla de inicio”</strong>.
        </p>
      </div>
    );
  }

  // 🔹 Caso Android: mostrar botón “Instalar App”
  if (showInstallButton) {
    return (
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 px-4 py-2 bg-[#7a1f7a] text-white rounded-full shadow-lg hover:bg-[#9a2d9a] transition-all"
      >
        Instalar App
      </button>
    );
  }

  return null;
}
