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

  const notificationTitle = payload.notification?.title || "Nuevo mensaje";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes un mensaje nuevo.",
    icon: '/icons/icon-192.png', 
    badge: '/icons/icon-192.png',
    image: payload.notification?.image || payload.data?.image || null, // mostramos la foto si existe
    vibrate: [200, 100, 200], // Vibración
    tag: 'chat-notification', // Evitamos que se amontonen si son del mismo tipo
    renotify: true, // Reavisa si ya hay una notificación con la misma tag
    data: {
      url: payload.data?.url || '/dashboard-user',
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// MANEJADOR DE CLICK: Esto abre la web al tocar la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Cierra la notificación

  // Obtener la URL de los datos que enviamos desde el backend
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Verificar si ya hay una pestaña abierta con esa URL o con el dominio
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // Si el cliente está en la URL exacta, darle foco
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay pestaña abierta en esa URL pero sí en el sitio, 
      // podemos navegar la pestaña existente en lugar de abrir una nueva
      if (windowClients.length > 0) {
        let client = windowClients[0];
        if ('navigate' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si no hay pestaña abierta, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});