import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; 

function toBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "on" || s === "yes";
  }
  return false;
}
function toDecimalOrNull(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
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
      const formData = await req.formData();

      const name = formData.get("name");
      const country = formData.get("country");
      const city = formData.get("city");
      const category = formData.get("category");
      const description = formData.get("description");
      const price = formData.get("price");
      const discountPrice = formData.get("discountPrice");
      const isActive = formData.get("isActive");
      const image = formData.get("image") as File | null;

      if (typeof name === "string") data.name = name.trim();
      if (typeof country === "string") data.country = country.trim();
      if (city === null || typeof city === "string") data.city = city ? city.trim() : null;
      if (category === null || typeof category === "string") data.category = category ? category.trim() : null;
      if (description === null || typeof description === "string") data.description = description ? description.trim() : null;

      const p = toDecimalOrNull(price);
      if (p !== null) data.price = p;

      const dp = toDecimalOrNull(discountPrice);
      data.discountPrice = dp; 

      data.isActive = toBool(isActive);

      if (image && typeof image === "object" && image.size > 0) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        try {
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        } catch (e) {
          return NextResponse.json(
            { error: "Almacenamiento local no disponible. Configura S3/Cloudinary." },
            { status: 400 }
          );
        }

        const original = image.name || "image";
        const ext = original.includes(".") ? original.split(".").pop() : "jpg";
        const fileName = `${id}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(await image.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        data.imageUrl = `/uploads/${fileName}`;
      }
    } else {
      const body = await req.json().catch(() => ({}));

      if (typeof body.name === "string") data.name = body.name.trim();
      if (typeof body.country === "string") data.country = body.country.trim();
      if (body.city === null || typeof body.city === "string") data.city = body.city ? String(body.city).trim() : null;
      if (body.category === null || typeof body.category === "string") data.category = body.category ? String(body.category).trim() : null;
      if (body.description === null || typeof body.description === "string") data.description = body.description ? String(body.description).trim() : null;

      const p = toDecimalOrNull(body.price);
      if (p !== null) data.price = p;

      const dp = toDecimalOrNull(body.discountPrice);
      data.discountPrice = dp;

      if (body.isActive !== undefined) data.isActive = toBool(body.isActive);

      if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
        data.imageUrl = body.imageUrl.trim();
      }
    }

    if (Object.keys(data).length === 0) {
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
    console.error("Error actualizando destino:", e);

    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Conflicto de único (nombre/país/ciudad)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "No se pudo actualizar",
        details: e?.message || String(e),
        usedMultipart,
      },
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
      select: { id: true, imageUrl: true },
    });

    if (!dest) {
      return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
    }

    await prisma.destination.delete({ where: { id: dest.id } });

    if (dest.imageUrl?.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", dest.imageUrl);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("No se pudo eliminar la imagen del disco:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error eliminando destino:", e);
    return NextResponse.json({ error: "No se pudo eliminar", details: e?.message || String(e) }, { status: 400 });
  }
}
