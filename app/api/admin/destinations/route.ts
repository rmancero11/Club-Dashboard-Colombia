import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { getAuth } from "@/app/lib/auth";

const DestinationSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  discountPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Precio con descuento inválido")
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();

    const normalizeDecimal = (value?: string | null) => {
      if (!value) return null;
      return value.replace(",", ".").trim();
    };

    const body = DestinationSchema.parse({
      name: formData.get("name") as string,
      country: formData.get("country") as string,
      city: (formData.get("city") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      isActive: formData.get("isActive") === "true",
      price: normalizeDecimal(formData.get("price") as string)!,
      discountPrice: normalizeDecimal(formData.get("discountPrice") as string),
    });

    // Subida de imagen (opcional)
    let imageUrl: string | undefined = undefined;
    const image = formData.get("image");
    if (image && image instanceof File) {
      const uploadResult: any = await uploadToCloudinary(image);
      imageUrl = uploadResult.secure_url as string;
    }

    // Normalizar strings vacíos a null donde aplique
    const norm = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);

    const nuevoDestino = await prisma.destination.create({
      data: {
        name: body.name.trim(),
        country: body.country.trim(),
        city: norm(body.city),
        description: norm(body.description),
        category: norm(body.category),
        isActive: body.isActive ?? true,
        imageUrl,
        price: new Prisma.Decimal(body.price),
        discountPrice: body.discountPrice ? new Prisma.Decimal(body.discountPrice) : null,
        // *** clave para resolver el error de tipos: relación requerida ***
      },
      select: { id: true },
    });

    return NextResponse.json({ destination: nuevoDestino }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando destino:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    // Prisma conflictos de unicidad (@@unique([name, country, city]))
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un destino con ese nombre/país/ciudad" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}
