import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "";
const enc = new TextEncoder();

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

async function getBusinessIdFromCookie(): Promise<string | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    return (payload as any)?.businessId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getBusinessIdFromCookie();
    if (!businessId) {
      return NextResponse.json({ error: "No autenticado o sin empresa" }, { status: 401 });
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
      price: normalizeDecimal(formData.get("price") as string),
      discountPrice: normalizeDecimal(formData.get("discountPrice") as string),
    });

    let imageUrl = "";
    const image = formData.get("image");
    if (image && image instanceof File) {
      const uploadResult: any = await uploadToCloudinary(image);
      imageUrl = uploadResult.secure_url;
    }

    const nuevoDestino = await prisma.destination.create({
      data: {
        businessId,
        name: body.name,
        country: body.country,
        city: body.city,
        description: body.description,
        category: body.category,
        isActive: body.isActive,
        imageUrl,
        price: new Prisma.Decimal(body.price),
        discountPrice: body.discountPrice ? new Prisma.Decimal(body.discountPrice) : null,
      },
    });

    return NextResponse.json({ destination: nuevoDestino }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando destino:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}
