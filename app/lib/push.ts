// lib/push.ts
import webpush from "web-push";

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn("⚠️ Falta configurar VAPID keys en variables de entorno");
}

webpush.setVapidDetails(
  "mailto:soporte@clubsolteros.com", // cambia al tuyo
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function sendPush(sub: any, payload: any) {
  await webpush.sendNotification(sub, JSON.stringify(payload));
}
