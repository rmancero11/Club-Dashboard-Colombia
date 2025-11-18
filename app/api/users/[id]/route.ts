import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        country: true,
        destino: true,
        preference: true,
        status: true,
        verified: true,
        role: true,
        phone: true,
        gender: true,
        lookingFor: true,
        galleryImages: true,
        online: true,
        comment: true,
        singleStatus: true,
        affirmation: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("❌ Error al obtener usuario público:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
