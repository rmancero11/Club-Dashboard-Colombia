import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

export async function POST(req: Request) {
  try {
    // 1️⃣ Verificar JWT desde cookies
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));

    // Tu token puede traer el ID en `sub` o en `id`
    const userId =
      (payload?.sub as string | undefined) || (payload as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // 2️⃣ Leer el formulario
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const phone = formData.get("phone") as string | null;
    const country = formData.get("country") as string | null;
    const dniFile = formData.get("dni") as File | null;
    const otherFile = formData.get("other") as File | null;

    // 3️⃣ Crear carpeta uploads si no existe
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // 4️⃣ Guardar archivos en disco si existen
    const saveFile = async (file: File | null, field: string) => {
      if (!file) return null;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `${userId}-${field}-${Date.now()}-${file.name}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      return `/uploads/${filename}`;
    };

    const dniUrl = await saveFile(dniFile, "dni");
    const otherUrl = await saveFile(otherFile, "other");

    // 5️⃣ Actualizar usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(country && { country }),
        ...(dniUrl && { dniFile: dniUrl }),
        ...(otherUrl && { otherFile: otherUrl }),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}
