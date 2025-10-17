import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Validaciones
    const MAX_BYTES = 12 * 1024 * 1024;
    if ((file as any).size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo supera 12 MB" }, { status: 413 });
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
    }

    const baseFolder =
      folderOverride ||
      ["clubviajeros", auth.businessId, clientId ? `clients/${clientId}` : "misc", field || "document"].join("/");

    const isPdf = file.type === "application/pdf";

    const originalName = (file as any).name || "document";
    const base = originalName.replace(/\.[a-z0-9]+$/i, ""); // sin extensión

    // 👇 public_id SIN ".pdf" (Cloudinary guarda format="pdf")
    const publicIdForPdf = `clients/${clientId || "misc"}/${field || "document"}/${base}-${Date.now()}`;

    const result = await uploadToCloudinary(file, {
      // Para PDF: subimos como raw + upload (público)
      ...(isPdf
        ? {
            resource_type: "raw",
            type: "upload",
            public_id: publicIdForPdf,
            folder: undefined, // evita duplicar "folder" + "public_id"
            overwrite: false,
          }
        : {
            // Imágenes: modo automático
            resource_type: "auto",
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            folder: baseFolder,
          }),
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

    // URL directa (pública) devuelta por Cloudinary
    const secureUrl = result.secure_url;

    // Nombre bonito para descarga
    const safeName = isPdf ? `${base}.pdf` : (result.original_filename || `${base}.${result.format || "file"}`);

    // Proxy opcional para fijar headers inline (no firma, solo headers)
    const proxyUrl = `/api/file-proxy?url=${encodeURIComponent(secureUrl)}&filename=${encodeURIComponent(safeName)}`;

    return NextResponse.json({
      ok: true,
      url: secureUrl,     // pública; puedes usarla tal cual
      proxyUrl,           // úsala en el visor para inline headers (recomendado)
      public_id: result.public_id,
      resource_type: result.resource_type, // "raw" para PDFs
      type: (result as any).type || "upload", // debería venir "upload"
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      folder: result.folder,
      original_filename: result.original_filename,
    });
  } catch (err: any) {
    console.error("[cloudinary-upload] error:", err);
    return NextResponse.json({ error: err?.message || "Error interno al subir" }, { status: 500 });
  }
}
