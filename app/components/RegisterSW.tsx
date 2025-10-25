"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      const swUrl = "/sw.js";

      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register(swUrl, { scope: "/" });

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                // Si ya hay SW activo, hay una actualización lista
                if (navigator.serviceWorker.controller) {
                  // Podrías mostrar un toast/modal aquí para recargar
                  // Por simplicidad, forzamos la recarga suave:
                  // window.location.reload();
                }
              }
            });
          });

          // Cuando se reciba el mensaje para saltarse el waiting
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            // console.log("Nuevo Service Worker activo");
          });
        } catch (e) {
          // console.error("Error al registrar el Service Worker:", e);
        }
      };

      // Registrar después de que la página esté cargada
      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register, { once: true });
      }
    }
  }, []);

  return null;
}

