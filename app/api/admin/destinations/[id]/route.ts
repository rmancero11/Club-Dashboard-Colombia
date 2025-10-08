import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let body: any = {};
  let data: any = {};

  try {
    // Si viene multipart/form-data (subida de imagen)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      body.name = formData.get("name");
      body.country = formData.get("country");
      body.city = formData.get("city");
      body.category = formData.get("category");
      body.description = formData.get("description");
      body.isActive = formData.get("isActive") === "true";

      const image = formData.get("image") as File | null;

      if (image && image.size > 0) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = image.name.split(".").pop();
        const fileName = `${params.id}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await image.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        data.imageUrl = `/uploads/${fileName}`;
      }
    } else {
      // Si viene JSON normal (para toggle, etc.)
      body = await req.json().catch(() => ({}));
    }

    // Procesamos los campos para actualizar
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.country === "string") data.country = body.country.trim();
    if (body.city === null || typeof body.city === "string") data.city = body.city ? body.city.trim() : null;
    if (body.category === null || typeof body.category === "string") data.category = body.category ? body.category.trim() : null;
    if (body.description === null || typeof body.description === "string") data.description = body.description ? body.description.trim() : null;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.destination.update({
      where: { id: params.id, businessId: auth.businessId },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("Error actualizando destino:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Conflicto de único (nombre/país/ciudad)" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
