import { prisma } from "@/app/lib/prisma";
import { DocumentType } from "@prisma/client";
import { getAuth } from "@/app/lib/auth";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* ===============================
   GET → Obtener documentos de una reserva
=============================== */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reservationId = params.id;

  try {
    const documents = await prisma.reservationDocument.findMany({
      where: { reservationId },
      orderBy: { uploadedAt: "desc" },
    });

    
    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error("❌ Error obteniendo documentos:", error);
    return NextResponse.json({ error: "Error obteniendo documentos" }, { status: 500 });
  }
}

/* ===============================
   POST → Subir y reemplazar documento
=============================== */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const reservationId = params.id;
  const files = formData.getAll("files") as File[];
  const type = formData.get("type") as string;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (!type || !files.length) {
    return NextResponse.json({ error: "Faltan archivos o tipo de documento" }, { status: 400 });
  }

  if (!Object.values(DocumentType).includes(type as DocumentType)) {
    return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
  }

  try {
    // 🔥 Eliminar documentos anteriores del mismo tipo
    const deleted = await prisma.reservationDocument.deleteMany({
      where: { reservationId, type: type as DocumentType },
    });
    console.log(`🗑️ [DEBUG] Documentos anteriores eliminados: ${deleted.count}`);

    const uploadedDocs = [];

    for (const file of files) {
      const uploadResult = await uploadToCloudinary(file, {
        folder: "reservations/docs",
        filename: file.name,
      });

      const doc = await prisma.reservationDocument.create({
        data: {
          reservationId,
          type: type as DocumentType,
          url: uploadResult.secure_url,
          uploadedById: auth.userId,
        },
      });

      
      uploadedDocs.push(doc);
    }

    return NextResponse.json({ documents: uploadedDocs }, { status: 201 });
  } catch (err: unknown) {
    console.error("❌ Error subiendo documentos:", err);
    return NextResponse.json({ error: "Error subiendo documentos" }, { status: 500 });
  }
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
    }

    // Buscar el documento y asegurarse de que pertenezca a la reserva
    const doc = await prisma.reservationDocument.findFirst({
      where: {
        id: documentId,
        reservationId: params.id,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Eliminar el documento
    await prisma.reservationDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ message: "Documento eliminado correctamente" }, { status: 200 });
  } catch (err) {
    console.error("❌ Error eliminando documento:", err);
    return NextResponse.json({ error: "Error eliminando documento" }, { status: 500 });
  }
}