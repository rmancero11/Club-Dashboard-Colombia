// /app/api/user/avatar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary (asegurate de tener las variables en .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    // 1️⃣ Verificar token
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // 2️⃣ Obtener archivo del FormData
    const formData = await req.formData();
    const file = formData.get("avatar") as File;
    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });

    // 3️⃣ Convertir archivo a base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 4️⃣ Subir a Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      folder: "avatars",
      public_id: decoded.id,
      overwrite: true,
    });

    // 5️⃣ Actualizar usuario en DB con la URL de Cloudinary
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { avatar: uploadResult.secure_url },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error al subir avatar:", error);
    return NextResponse.json({ error: "Error al subir avatar" }, { status: 500 });
  }
}
