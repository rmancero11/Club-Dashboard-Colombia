import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

  const current = String(body?.current ?? "").trim();
  const next = String(body?.next ?? "").trim();

  if (!current || !next) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "La nueva contraseña es muy corta" }, { status: 400 });
  }
  if (current === next) {
    return NextResponse.json({ error: "La nueva contraseña no puede ser igual a la actual" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { password: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const ok = await bcrypt.compare(current, user.password);
    if (!ok) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
    }

    // (Opcional) impedir reutilizar contraseña inmediata comparando hash
    const sameAsOld = await bcrypt.compare(next, user.password);
    if (sameAsOld) {
      return NextResponse.json({ error: "La nueva contraseña no puede ser igual a la anterior" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(next, 10);
    await prisma.user.update({ where: { id: auth.userId }, data: { password: hashed } });

    // (Opcional) aquí podrías invalidar sesiones activas si tu auth lo soporta
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo cambiar la contraseña" }, { status: 500 });
  }
}
