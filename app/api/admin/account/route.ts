// app/api/admin/account/route.ts
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth || !auth.userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.name === null || typeof body.name === "string") data.name = body.name ?? null;
  if (body.phone === null || typeof body.phone === "string") data.phone = body.phone ?? null;
  if (body.timezone === null || typeof body.timezone === "string") data.timezone = body.timezone ?? null;

  try {
    await prisma.user.update({ where: { id: auth.userId }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la cuenta" }, { status: 400 });
  }
}
