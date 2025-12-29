importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAv316guZ8xMcqutkYB92R1Vh1ZWgyRQyE",
  authDomain: "club-colombia-notifications.firebaseapp.com",
  projectId: "club-colombia-notifications",
  storageBucket: "club-colombia-notifications.firebasestorage.app",
  messagingSenderId: "126042656412",
  appId: "1:126042656412:web:a07cb92540945c7c216759"
});

const messaging = firebase.messaging();

// Escuchar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Notificación recibida en segundo plano:', payload);

  const notificationTitle = payload.notification.title || "Nuevo mensaje";
  const notificationOptions = {
    body: payload.notification.body || "Tienes contenido nuevo.",
    icon: '/icons/icon-512.png', 
    badge: '/icons/icon-192.png',
    data: {
      url: payload.data?.url || '/' // Pasamos la URL que viene desde el backend
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// MANEJADOR DE CLICK: Esto abre la web al tocar la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Cierra la notificación

  // Obtener la URL de los datos que enviamos desde el backend
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una pestaña abierta, enfocarla
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay pestaña abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});