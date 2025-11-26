import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth"; 
import { uploadToCloudinary } from "@/app/lib/cloudinary"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. AUTENTICACIÓN
    // Verificamos que el usuario esté logueado.
    const auth = await getAuth();
    if (!auth || !auth.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Falta 'file'" }, { status: 400 });
    }

    // 2. VALIDACIONES DE ARCHIVO
    const MAX_BYTES = 12 * 1024 * 1024; // 12 MB (Reutilizamos el límite)
    const size = (file as any).size ?? 0;
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo supera 12 MB" }, { status: 413 });
    }

    const mime = (file as any).type || "";
    const name = (file as any).name || "image";
    const isImage = mime.startsWith("image/");
    if (!isImage) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 415 });
    }

    // 3. SUBIDA A CLOUDINARY (Carpeta dedicada al chat)
    // Usamos el ID del usuario como subcarpeta para organizar.
    const userIdFolder = auth.userId;
    const baseFolder = `clubviajeros/chat-images/${userIdFolder}`;
    const baseName = name.replace(/\.[a-z0-9]+$/i, "");
    const publicId = `${baseFolder}/${baseName}-${Date.now()}`;

    // Subimos usando la función de librería que ya existe
    const result = await uploadToCloudinary(file, {
      resource_type: "image",
      access: "public",
      filename: name,
      cloudinary: {
        type: "upload",
        public_id: publicId,
        overwrite: false,
        context: {
          userId: auth.userId,
          role: auth.role,
        },
        tags: [
          "clubviajeros",
          "chat-image",
          `user:${auth.userId}`,
        ],
      },
    });

    const secureUrl = result.secure_url;

    // 4. RESPUESTA
    // Devolvemos la URL segura que se incluirá en el mensaje del socket.
    return NextResponse.json({
      ok: true,
      imageUrl: secureUrl, 
      public_id: result.public_id,
    });

  } catch (err: any) {
    console.error("[chat-image-upload] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno al subir la imagen del chat" },
      { status: 500 }
    );
  }
}