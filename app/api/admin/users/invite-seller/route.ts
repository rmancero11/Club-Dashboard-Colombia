import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function genTempPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const name = (body?.name && String(body.name).trim()) || null;
  const commissionRateNum = Number(body?.commissionRate ?? 10);

  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  if (Number.isNaN(commissionRateNum) || commissionRateNum < 0 || commissionRateNum > 100) {
    return NextResponse.json({ error: "commissionRate debe estar entre 0 y 100" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });

  const tempPassword = genTempPassword(12);
  const hash = await bcrypt.hash(tempPassword, 10);

  const created = await prisma.user.create({
    data: {
      email,
      name,
      password: hash,
      role: "SELLER",              // enum Role
      status: "ACTIVE",            // enum UserStatus
      commissionRate: commissionRateNum.toFixed(2), // Decimal(5,2)
      timezone: "America/Bogota",
      verified: false,
    },
    select: { id: true, email: true, name: true, role: true, commissionRate: true },
  });

  // (Opcional) registrar actividad
  // await prisma.activityLog.create({
  //   data: { action: "NOTE", message: `Invitado SELLER ${email}`, userId: auth.userId }
  // });

  return NextResponse.json({ user: created, tempPassword }, { status: 201 });
}
