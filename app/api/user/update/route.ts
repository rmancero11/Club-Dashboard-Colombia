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
    const userId = (payload?.sub as string) || (payload as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // 2️⃣ Leer el formulario
    const formData = await req.formData();
    const name = (formData.get("name") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const country = (formData.get("country") as string)?.trim() || null;

    // 🔑 Asegurarse de usar los nombres correctos de los inputs
    const dniFile = formData.get("dni") as File | null;
    const passportFile = formData.get("passport") as File | null;
    const visaFile = formData.get("visa") as File | null;

    // 3️⃣ Crear carpeta uploads si no existe
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // 4️⃣ Función para guardar archivo
    const saveFile = async (file: File | null, field: string) => {
      if (!file) return null;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // Sanitizar el nombre del archivo
      const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
      const filename = `${userId}-${field}-${Date.now()}-${safeName}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      return `/uploads/${filename}`;
    };

    // 5️⃣ Guardar archivos
    const dniUrl = await saveFile(dniFile, "dni");
    const passportUrl = await saveFile(passportFile, "passport");
    const visaUrl = await saveFile(visaFile, "visa");

    // 6️⃣ Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(country && { country }),
        ...(dniUrl && { dniFile: dniUrl }),
        ...(passportUrl && { passport: passportUrl }),
        ...(visaUrl && { visa: visaUrl }),
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
