// app/api/user/preferences/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET no está definido");

const enc = new TextEncoder();

export async function POST(req: Request) {
  try {
    // 1️⃣ Verificar token JWT desde cookies
    const token = cookies().get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    const userId = (payload?.sub as string) || (payload as any)?.id;
    if (!userId)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    // 2️⃣ Leer FormData
    const formData = await req.formData();
    const preferenceRaw = formData.getAll("preference") || [];
    const destinoRaw = formData.getAll("destino") || [];

    // 3️⃣ Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(preferenceRaw.length > 0 && {
          preference: preferenceRaw.join(", "),
        }),
        ...(destinoRaw.length > 0 && { destino: destinoRaw.join(", ") }),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error("Error actualizando preferencias:", err);
    return NextResponse.json(
      { error: "Error actualizando preferencias" },
      { status: 500 }
    );
  }
}
