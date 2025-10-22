// app/api/account/route.ts
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth || !auth.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // Solo permitimos actualizar campos existentes en User
  const data: Record<string, any> = {};
  if (body.name === null || typeof body.name === "string") data.name = body.name ?? null;
  if (body.phone === null || typeof body.phone === "string") data.phone = body.phone ?? null;
  if (body.timezone === null || typeof body.timezone === "string") data.timezone = body.timezone ?? null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data,
      select: { id: true, email: true, name: true, phone: true, timezone: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo actualizar la cuenta" }, { status: 400 });
  }
}

// (Opcional) puedes añadir un GET si quieres precargar datos desde el cliente
export async function GET() {
  const auth = await getAuth();
  if (!auth || !auth.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, phone: true, timezone: true },
  });
  if (!me) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ user: me });
}
