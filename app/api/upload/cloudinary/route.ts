import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const clientId = (form.get("clientId") as string | null) ?? undefined;
    const field = (form.get("field") as string | null) ?? undefined;
    const folderOverride = (form.get("folder") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ error: "Falta 'file'" }, { status: 400 });
    }

    // === Autorización alineada con schema.prisma ===
    // Si se provee clientId:
    //  - ADMIN: siempre ok
    //  - SELLER: debe ser el seller del cliente
    //  - USER: debe ser el dueño del perfil de cliente (client.userId === auth.userId)
    let clientRecord: { id: string; sellerId: string; userId: string } | null =
      null;
    if (clientId) {
      clientRecord = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, sellerId: true, userId: true },
      });

      if (!clientRecord) {
        return NextResponse.json(
          { error: "Cliente no existe" },
          { status: 404 }
        );
      }

      const isAdmin = auth.role === "ADMIN";
      const isSellerOwner =
        auth.role === "SELLER" && clientRecord.sellerId === auth.userId;
      const isClientUser =
        auth.role === "USER" && clientRecord.userId === auth.userId;

      if (!isAdmin && !isSellerOwner && !isClientUser) {
        return NextResponse.json(
          { error: "Sin permisos para este cliente" },
          { status: 403 }
        );
      }
    }

    // Validaciones de tamaño y tipo
    const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
    const size = (file as any).size ?? 0;
    if (size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Archivo supera 12 MB" },
        { status: 413 }
      );
    }

    const mime = (file as any).type || "";
    const name = (file as any).name || "document";
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    if (!isPdf && !isImage && !isVideo)
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 415 });

    const baseFolder = [
      "clubviajeros",
      clientId ? `clients/${clientId}` : "misc",
      field || "document",
    ].join("/");
    const baseName = name.replace(/\.[a-z0-9]+$/i, "");
    const publicId = `${baseFolder}/${baseName}-${Date.now()}`;

    const result = await uploadToCloudinary(file, {
      resource_type: isVideo ? "video" : "image", // 👈 PDF = image
      access: "public",
      filename: name,
      cloudinary: {
        type: "upload",
        public_id: publicId,
        overwrite: false,
        ...(isPdf ? { format: "pdf" } : {}), // asegura extensión en PDF
        context: { userId: auth.userId!, clientId, field, role: auth.role },
        tags: [
          "clubviajeros",
          clientId ? `client:${clientId}` : "client:unknown",
          field ? `field:${field}` : "field:document",
          `role:${auth.role}`,
        ],
      },
    });

    const secureUrl = result.secure_url;
    const downloadName = isPdf
      ? `${baseName}.pdf`
      : result.original_filename || `${baseName}.${result.format || "file"}`;
    const proxyUrl = `/api/file-proxy?url=${encodeURIComponent(
      secureUrl
    )}&filename=${encodeURIComponent(downloadName)}${
      clientId ? `&clientId=${clientId}` : ""
    }`;
    return NextResponse.json({
      ok: true,
      url: secureUrl,
      proxyUrl,
      public_id: result.public_id,
      resource_type: result.resource_type,
      type: (result as any).type || "upload",
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      folder: result.folder,
      original_filename: result.original_filename,
    });
  } catch (err: any) {
    console.error("[cloudinary-upload] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno al subir" },
      { status: 500 }
    );
  }
}
