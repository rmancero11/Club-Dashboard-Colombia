import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
          
          if (currentToken && currentToken !== localStorage.getItem('fcm_token')) {
            setToken(currentToken);
            
            await fetch('/api/user/device-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: currentToken })
            });
            localStorage.setItem('fcm_token', currentToken);
          }
        }
      } catch (error) {
        console.error('Error consiguiendo token FCM:', error);
      }
    };
    requestPermission();

    // Escuchamos mensajes en primer plano
    const unsubscribe = onMessage(messaging, (payload) => {

      // OBTENEMOS EL ID DEL CHAT DESDE LA URL ACTUAL
      const params = new URLSearchParams(window.location.search);
      const activeChatId = params.get('chatId');
      const incomingSenderId = payload.data?.senderId; // Asegúrate de enviar esto desde el server

      // 2. LOGICA INTELIGENTE: 
      // Si el usuario ya está en el chat con esa persona, no mostramos el Sonner.
      if (activeChatId === incomingSenderId) {
        console.log("Usuario en el chat activo, no mostramos alerta visual.");
        return;
      }

      // --- ESTILO MODERNO PARA VIAJES ---
      toast.custom((t) => (
        <div 
          onClick={() => {
            toast.dismiss(t);
            router.push(payload.data?.url || '/dashboard-user');
          }}
          className="flex items-center w-full max-w-md p-4 bg-white border border-blue-100 rounded-2xl shadow-2xl cursor-pointer hover:bg-blue-50 transition-colors duration-300"
          style={{ borderLeft: '6px solid #3b82f6' }} // Color azul "Travel"
        >
          {/* Icono o Avatar del remitente */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
            {payload.notification?.image ? (
              <img src={payload.notification.image} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">
                <img src="/icons/icon-192.png" alt="preview" className="w-full h-full object-cover" />
              </span> 
            )}
          </div>

          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-gray-900 leading-none">
              {payload.notification?.title || "Nuevo mensaje"}
            </p>
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
              {payload.notification?.body || "Tienes un nuevo mensaje"}
            </p>
          </div>

          <div className="ml-4 text-blue-500 font-semibold text-xs uppercase tracking-wider">
            Ver
          </div>
        </div>
      ), {
        duration: 6000,
        position: 'top-right',
      });
    });

    return () => unsubscribe();
  }, [userId, router]);

  return { token };
};

export default useFcmToken;