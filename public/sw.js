// SW básico + mejoras para push
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
  // Log básico de vida del SW
  console.log("[SW] Activated");
});

// Recibir PUSH y mostrar notificación
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // algunos backends envían string
    try { data = JSON.parse(event.data.text()); } catch {}
  }

  const title = data.title || "ClubSolteros";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",     // pequeño
    badge: data.badge || "/icons/badge-72.png",   // monocromo 72x72 (opcional)
    image: data.image,                             // grande (Android)
    data: { url: data.url || "/" },               // a dónde ir al tocar
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click en la notificación => abrir/enfocar
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Si ya hay una pestaña, enfócala y navega
      for (const client of list) {
        if ("focus" in client) {
          client.focus();
          if (url) client.navigate(url);
          return;
        }
      }
      // Si no hay pestaña, abre una nueva
      return clients.openWindow(url);
    })
  );
});

// Si el navegador rota la suscripción, aquí podríamos re-registrarla.
// Necesita que tu app exponga un endpoint para volver a guardar la nueva sub.
self.addEventListener("pushsubscriptionchange", async (event) => {
  console.log("[SW] pushsubscriptionchange");
  // Puedes intentar re-suscribir aquí si mantienes la VAPID pública en cache
  // y postearla a tu /api/push/subscribe. Muchas apps lo hacen desde la UI.
});
