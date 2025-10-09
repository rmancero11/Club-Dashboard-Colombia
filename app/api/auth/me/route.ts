import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

type Role = "ADMIN" | "SELLER" | "USER";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    const userId =
      (payload?.sub as string | undefined) ||
      (payload as any)?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        country: true,
        budget: true,
        preference: true,
        destino: true,
        createdAt: true,
        avatar: true,
        businessId: true,
        dniFile: true,      // 👈 nuevo
        passport: true,     // 👈 nuevo
        visa: true,         // 👈 nuevo
        clientProfile: {
          select: {
            id: true,
            seller: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cuenta inactiva" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 👇 Mapeo actualizado
    const userShape = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      phone: user.phone,
      country: user.country,
      budget: user.budget,
      preference: user.preference,
      destino: user.destino,
      createdAt: user.createdAt,
      avatar: user.avatar,
      businessId: user.businessId,
      dniFile: user.dniFile,
      passport: user.passport,
      visa: user.visa,
      clientProfileId: user.clientProfile?.id ?? null,
      vendedor: user.clientProfile?.seller
        ? {
            nombre: user.clientProfile.seller.name,
            telefono: user.clientProfile.seller.phone,
          }
        : null,
    };

    return NextResponse.json(
      { user: userShape },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Error en /api/user/me:", err);
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}
