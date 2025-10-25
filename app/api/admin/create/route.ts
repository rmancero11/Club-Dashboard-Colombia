import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { hashPassword } from "@/app/lib/hash";

function validate(body: any) {
  const errors: string[] = [];
  if (!body?.email || typeof body.email !== "string") errors.push("Email es requerido.");
  if (!body?.password || typeof body.password !== "string") errors.push("Password es requerido.");
  if (body?.password && String(body.password).length < 8) errors.push("El password debe tener mínimo 8 caracteres.");
  if (body?.name && typeof body.name !== "string") errors.push("Nombre inválido.");
  if (body?.phone && typeof body.phone !== "string") errors.push("Teléfono inválido.");
  if (body?.timezone && typeof body.timezone !== "string") errors.push("Zona horaria inválida.");
  return errors;
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const errors = validate(body);
    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const { email, password, name, phone, timezone } = body;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: name || null,
        phone: phone || null,
        timezone: timezone || null,
        role: "ADMIN",
        status: "ACTIVE",
        verified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "NOTE",
        message: "ADMIN_CREATED",
        metadata: { createdBy: auth.userId, createdUserId: user.id, email: user.email },
        userId: auth.userId,
      },
    }).catch(() => { /* no bloquear por log */ });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "El email ya está registrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno al crear el administrador." }, { status: 500 });
  }
}
