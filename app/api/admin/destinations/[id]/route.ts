import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "on" || s === "yes";
  }
  return false;
}
function toDecimalOrUndef(v: unknown) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function toDecimalOrNull(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function tryExtractPublicIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return null;
    const after = parts.slice(idx + 2).join("/"); // salta v<version>
    const noExt = after.replace(/\.[a-z0-9]+$/i, "");
    return noExt || null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = params.id;
  const contentType = req.headers.get("content-type") || "";
  const data: any = {};
  let usedMultipart = false;

  try {
    if (contentType.includes("multipart/form-data")) {
      usedMultipart = true;
      const form = await req.formData();

      const name = form.get("name");
      const country = form.get("country");
      const city = form.get("city");
      const category = form.get("category");
      const description = form.get("description");

      if (typeof name === "string") data.name = name.trim();
      if (typeof country === "string") data.country = country.trim();
      if (city === null || typeof city === "string") data.city = city ? city.trim() : null;
      if (category === null || typeof category === "string") data.category = category ? category.trim() : null;
      if (description === null || typeof description === "string") data.description = description ? description.trim() : null;

      data.price = toDecimalOrUndef(form.get("price"));                 // undefined = no cambiar
      data.discountPrice = toDecimalOrNull(form.get("discountPrice"));  // null = limpiar, undefined = no cambiar

      const isActive = form.get("isActive");
      if (isActive !== null) data.isActive = toBool(isActive);

      // ✅ Acepta "image" o "file"
      const image =
        (form.get("image") as File | null) ??
        (form.get("file") as File | null) ??
        null;

      if (image && image.size > 0) {
        const mime = (image as any).type || "";
        const originalName = (image as any).name || "image";
        const isVideo = mime.startsWith("video/");
        const isPdf = mime === "application/pdf" || /\.pdf$/i.test(originalName);

        const publicId = `clubviajeros/destinations/${id}-${Date.now()}`;

        const uploaded = await uploadToCloudinary(image, {
          resource_type: isVideo ? "video" : isPdf ? "image" : "image",
          access: "public",
          filename: originalName,
          cloudinary: {
            type: "upload",
            public_id: publicId,
            overwrite: false,
            ...(isPdf ? { format: "pdf" } : {}),
            context: { destinationId: id, role: auth.role, userId: auth.userId },
            tags: ["clubviajeros", "destinations", `destination:${id}`],
          },
        });

        data.imageUrl = uploaded.secure_url;
        // Si guardas public_id, puedes añadir: data.imagePublicId = uploaded.public_id;
      }
    } else {
      // JSON
      const body = await req.json().catch(() => ({}));

      if (typeof body.name === "string") data.name = body.name.trim();
      if (typeof body.country === "string") data.country = body.country.trim();
      if (body.city === null || typeof body.city === "string") data.city = body.city ? String(body.city).trim() : null;
      if (body.category === null || typeof body.category === "string") data.category = body.category ? String(body.category).trim() : null;
      if (body.description === null || typeof body.description === "string") data.description = body.description ? String(body.description).trim() : null;

      if (body.price !== undefined) data.price = toDecimalOrUndef(body.price);
      if (body.discountPrice !== undefined) data.discountPrice = toDecimalOrNull(body.discountPrice);
      if (body.isActive !== undefined) data.isActive = toBool(body.isActive);
      if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
        data.imageUrl = body.imageUrl.trim();
      }
    }

    // No intentes actualizar si no hay cambios
    const hasChanges = Object.keys(data).length > 0;
    if (!hasChanges) {
      return NextResponse.json(
        { error: "No se enviaron cambios para actualizar." },
        { status: 400 }
      );
    }

    const updated = await prisma.destination.update({
      where: { id },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("[destinations:PATCH] error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Conflicto de único (nombre/país/ciudad)" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar", details: e?.message || String(e), usedMultipart },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const dest = await prisma.destination.findUnique({
      where: { id: params.id },
      select: { id: true, imageUrl: true /*, imagePublicId: true*/ },
    });
    if (!dest) {
      return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
    }

    await prisma.destination.delete({ where: { id: dest.id } });

    const publicId =
      // dest.imagePublicId ||
      tryExtractPublicIdFromUrl(dest.imageUrl);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (e) {
        console.warn("No se pudo eliminar en Cloudinary:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[destinations:DELETE] error:", e);
    return NextResponse.json(
      { error: "No se pudo eliminar", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}
