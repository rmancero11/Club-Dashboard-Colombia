import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma"; // Asegúrate de que esta sea tu instancia global de prisma
import { messaging } from "@/app/lib/firebase-admin";

/**
 * POST: Registro o actualización del Token del dispositivo.
 * Se llama desde el frontend al obtener el token de Firebase.
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuth();

    if (!auth || !auth.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    console.log("Este es el tokeeeeen: ", token);
    
    if (!token) {
      return NextResponse.json({ message: "Missing token" }, { status: 400 });
    }

    // Usamos upsert para evitar duplicados: 
    // Si el token ya existe, actualiza el usuario asociado.
    // Si no existe, lo crea.
    await prisma.deviceToken.upsert({
      where: { token: token },
      update: { userId: auth.userId },
      create: {
        token: token,
        userId: auth.userId,
      },
    });

    return NextResponse.json({ message: "Token registrado correctamente" });
  } catch (error) {
    console.error("Error en POST device-token:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT: Envío manual/test de notificación push.
 * Úsalo para probar que los mensajes llegan.
 */
export async function PUT(request: Request) {
  try {
    const auth = await getAuth();

    // Opcional: Podrías restringir quién puede enviar notificaciones manuales
    if (!auth || !auth.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token, title, body, link } = await request.json();

    if (!token || !title || !body) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      // Datos extra para el Service Worker (como la URL)
      data: {
        url: link || "/dashboard-user",
      },
      // Configuración específica para Web Push
      webpush: {
        fcmOptions: {
          link: link || "/dashboard-user",
        },
        notification: {
          icon: "/icons/icon-512.png", 
          badge: "/icons/icon-192.png",
          click_action: link || "/dashboard-user",
        }
      },
    };

    const response = await messaging.send(message);
    return NextResponse.json({ success: true, responseId: response });
  } catch (error) {
    console.error("Error enviando push manual:", error);
    return NextResponse.json({ error: "Error enviando push" }, { status: 500 });
  }
}