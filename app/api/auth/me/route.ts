export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

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
    const userId = (payload?.sub as string | undefined) || (payload as any)?.id;
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
        verified: true,
        avatar: true,
        // businessId: true,  // ❌ ya no existe
        dniFile: true,
        passport: true,
        visa: true,
        comment: true,
        singleStatus: true,
        affirmation: true,
        acceptedTerms: true,
        flow: true,
        birthday: true,
        gender: true,
        lookingFor: true,

        // Archivos nuevos
        purchaseOrder: true,
        flightTickets: true,
        serviceVoucher: true,
        medicalAssistanceCard: true,
        travelTips: true,

        // Links del vendedor
        whatsappNumber: true,
        currentlyLink: true,

        // Perfil de cliente (si role = USER)
        clientProfile: {
          select: {
            id: true,
            seller: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
                whatsappNumber: true,
                currentlyLink: true,
              },
            },
            reservations: {
              where: { status: { not: "CANCELED" } },
              orderBy: { startDate: "asc" },
              take: 1,
              select: {
                id: true,
                startDate: true,
                endDate: true,
                destination: {
                  select: {
                    id: true,
                    name: true,
                    country: true,
                    city: true,
                    description: true,
                    imageUrl: true,
                  },
                },
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

    const userShape = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      country: user.country,
      budget: user.budget,
      preference: user.preference,
      destino: user.destino,
      createdAt: user.createdAt,
      verified: user.verified,
      avatar: user.avatar,
      // businessId: user.businessId, // ❌ quitar
      dniFile: user.dniFile,
      passportFile: user.passport,
      visaFile: user.visa,
      comment: user.comment,
      singleStatus: user.singleStatus,
      affirmation: user.affirmation,
      acceptedTerms: user.acceptedTerms,
      flow: user.flow,
      birthday: user.birthday,
      gender: user.gender,
      lookingFor: user.lookingFor,

      // Archivos
      purchaseOrder: user.purchaseOrder,
      flightTickets: user.flightTickets,
      serviceVoucher: user.serviceVoucher,
      medicalAssistanceCard: user.medicalAssistanceCard,
      travelTips: user.travelTips,

      // Vendedor asignado
      vendedor: user.clientProfile?.seller
        ? {
            nombre: user.clientProfile.seller.name,
            telefono: user.clientProfile.seller.phone,
            avatar: user.clientProfile.seller.avatar,
            whatsappNumber: user.clientProfile.seller.whatsappNumber,
            currentlyLink: user.clientProfile.seller.currentlyLink,
          }
        : null,

      // Próximo destino reservado
      nextDestination: user.clientProfile?.reservations?.[0]?.destination ?? null,
    };

    return NextResponse.json(
      { user: userShape },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Error en /api/auth/me:", err);
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}
