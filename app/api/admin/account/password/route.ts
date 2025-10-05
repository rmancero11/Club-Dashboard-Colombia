import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth || !auth.userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const current = String(body?.current || "");
  const next = String(body?.next || "");
  if (!current || !next) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  if (next.length < 6) return NextResponse.json({ error: "La nueva contraseña es muy corta" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { password: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(current, user.password);
  if (!ok) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });

  const hashed = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: auth.userId }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
