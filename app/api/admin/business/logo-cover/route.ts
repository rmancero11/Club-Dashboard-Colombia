import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import cloudinary from "@/app/lib/cloudinary";

export const runtime = "nodejs"; // para usar el SDK de cloudinary y Buffers

async function uploadToCloudinary(file: File, folder: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,                 // p.ej: "clubviajeros/business"
        resource_type: "image",
        overwrite: true,
        // opcionales:
        // transformation: [{ width: 2000, height: 2000, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
      }
    );
    stream.end(buffer);
  });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = formData.get("Name")?.toString();
  const iconFile = formData.get("IconoWhite") as File | null;
  const coverFile = formData.get("Cover") as File | null;

  let iconResult: { secure_url: string; public_id: string } | undefined;
  let coverResult: { secure_url: string; public_id: string } | undefined;

  const folder = `clubviajeros/business/${auth.businessId}`;

  if (iconFile && iconFile.size > 0) {
    iconResult = await uploadToCloudinary(iconFile, `${folder}/icon`);
  }
  if (coverFile && coverFile.size > 0) {
    coverResult = await uploadToCloudinary(coverFile, `${folder}/cover`);
  }

  const updated = await prisma.business.update({
    where: { id: auth.businessId },
    data: {
      ...(name ? { Name: name } : {}),
      ...(iconResult ? { IconoWhite: iconResult.secure_url } : {}),
      ...(coverResult ? { Cover: coverResult.secure_url } : {}),
      // Sugerencia: si quieres poder reemplazar/eliminar, guarda también los public_id:
      // IconoWhiteId: iconResult?.public_id,
      // CoverId: coverResult?.public_id,
    },
    select: { id: true, Name: true, IconoWhite: true, Cover: true },
  });

  return NextResponse.json({ ok: true, business: updated });
}
