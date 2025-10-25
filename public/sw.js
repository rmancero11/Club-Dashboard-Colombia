// SW mínimo para habilitar modo standalone e instalación en Android
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());