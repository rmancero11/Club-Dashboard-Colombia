import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Evitamos inicializar la app más de una vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const useFcmToken = (userId: string | undefined) => {
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!userId) return;

    const messaging = getMessaging(app);

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, { 
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY 
          });
          
          if (currentToken) {
            setToken(currentToken);
            
            await fetch('/api/user/device-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: currentToken })
            });
          }
        }
      } catch (error) {
        console.error('Error consiguiendo token FCM:', error);
      }
    };
    requestPermission();

    // Escuchamos mensajes en primer plano
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano: ', payload);

      // Mostramos una alerta visual con Sonner
      toast.info(payload.notification?.title || "Nuevo mensaje", {
        description: payload.notification?.body || "Tienes un mensaje nuevo en el chat",
        duration: 5000,
        // icon: '/icons/icon-512.png',
        action: {
          label: 'Ver chat',
          onClick: () => {
            window.location.href = payload.data?.url || '/dashboard-user';
          },
        },
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return { token };
};

export default useFcmToken;