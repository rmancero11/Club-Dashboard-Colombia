import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";        // ✅ Cloudinary requiere Node
export const dynamic = "force-dynamic"; // evita caché en dev/preview

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!auth.businessId) return NextResponse.json({ error: "Sin empresa" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const clientId = (form.get("clientId") as string | null) ?? undefined;
    const field = (form.get("field") as string | null) ?? undefined;
    const folderOverride = (form.get("folder") as string | null) ?? undefined;

    if (!file) return NextResponse.json({ error: "Falta 'file'" }, { status: 400 });

    // Si no es ADMIN, valida pertenencia del cliente
    if (clientId && auth.role !== "ADMIN") {
      const ok = await prisma.client.findFirst({
        where: { id: clientId, businessId: auth.businessId, sellerId: auth.userId },
        select: { id: true },
      });
      if (!ok) return NextResponse.json({ error: "Sin permisos para este cliente" }, { status: 403 });
    }

    // (Opcional) validaciones básicas
    const MAX_BYTES = 12 * 1024 * 1024;
    if ((file as any).size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo supera 12 MB" }, { status: 413 });
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
    }

    const folder =
      folderOverride ||
      ["clubviajeros", auth.businessId, clientId ? `clients/${clientId}` : "misc", field || "document"].join("/");

    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      context: {
        businessId: auth.businessId!,
        userId: auth.userId!,
        ...(clientId ? { clientId } : {}),
        ...(field ? { field } : {}),
      } as any,
      tags: [
        "clubviajeros",
        `business:${auth.businessId}`,
        clientId ? `client:${clientId}` : "client:unknown",
        field ? `field:${field}` : "field:document",
        `role:${auth.role}`,
      ],
    });

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      folder: result.folder,
      original_filename: result.original_filename,
    });
  } catch (err: any) {
    // 👇 Esto garantiza JSON aunque crashee algo
    console.error("[cloudinary-upload] error:", err);
    return NextResponse.json({ error: err?.message || "Error interno al subir" }, { status: 500 });
  }
}
