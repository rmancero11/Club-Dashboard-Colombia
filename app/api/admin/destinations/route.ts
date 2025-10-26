import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { getAuth } from "@/app/lib/auth";

// Helpers
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const decimalRegex = /^\d+(\.\d{1,2})?$/;

// === Zod schemas ===
const TripDateSchema = z.object({
  startDate: z.string().min(1, "startDate requerido"),
  endDate: z.string().min(1, "endDate requerido"),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

const PayloadSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  description: z.string().optional(),

  membership: z.enum(["STANDARD", "PREMIUM", "VIP"]).optional().default("STANDARD"),

  // Categorías viene como JSON string de array de strings
  categories: z
    .string()
    .transform((s) => (s ? (JSON.parse(s) as unknown) : []))
    .pipe(z.array(z.string().min(1)).optional().default([])),

  // Precios obligatorios: USD/COP con y sin aéreo
  priceUSDWithAirfare: z.string().regex(decimalRegex, "USD con aéreo inválido"),
  priceUSDWithoutAirfare: z.string().regex(decimalRegex, "USD sin aéreo inválido"),
  priceCOPWithAirfare: z.string().regex(/^\d+(\.\d{1,2})?$/, "COP con aéreo inválido"),
  priceCOPWithoutAirfare: z.string().regex(/^\d+(\.\d{1,2})?$/, "COP sin aéreo inválido"),

  // “Desde” opcionales
  baseFromUSD: z.string().regex(decimalRegex, "Desde USD inválido").optional().nullable(),
  baseFromCOP: z.string().regex(/^\d+(\.\d{1,2})?$/, "Desde COP inválido").optional().nullable(),

  // Fechas viene como JSON string de array
  tripDates: z
    .string()
    .transform((s) => (s ? (JSON.parse(s) as unknown) : []))
    .pipe(z.array(TripDateSchema).optional().default([])),

  // isActive del destino (opcional)
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();

    // Normaliza decimales con coma → punto (si te llega así)
    const normDec = (v: FormDataEntryValue | null) =>
      v == null ? null : String(v).replace(",", ".").trim();

    // Construimos objeto crudo desde FormData para pasarlo a Zod
    const raw = {
      name: formData.get("name"),
      country: formData.get("country"),
      city: formData.get("city") || undefined,
      description: formData.get("description") || undefined,

      membership: (formData.get("membership") as string) || "STANDARD",

      categories: (formData.get("categories") as string) || "[]",

      priceUSDWithAirfare: normDec(formData.get("priceUSDWithAirfare")),
      priceUSDWithoutAirfare: normDec(formData.get("priceUSDWithoutAirfare")),
      priceCOPWithAirfare: normDec(formData.get("priceCOPWithAirfare")),
      priceCOPWithoutAirfare: normDec(formData.get("priceCOPWithoutAirfare")),
      baseFromUSD: normDec(formData.get("baseFromUSD")),
      baseFromCOP: normDec(formData.get("baseFromCOP")),

      tripDates: (formData.get("tripDates") as string) || "[]",

      isActive: (formData.get("isActive") as string) === "true",
    };

    const body = PayloadSchema.parse(raw);

    // Valida fechas (start <= end)
    for (const td of body.tripDates) {
      const s = new Date(td.startDate);
      const e = new Date(td.endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) {
        return NextResponse.json(
          { error: "Fechas inválidas en tripDates (startDate/endDate)" },
          { status: 400 }
        );
      }
    }

    // Imagen (opcional)
    let imageUrl: string | undefined = undefined;
    const image = formData.get("image");
    if (image && image instanceof File && image.size > 0) {
      const uploadResult: any = await uploadToCloudinary(image);
      imageUrl = uploadResult.secure_url as string;
    }

    // Conectar/crear categorías por slug
    const categoriesConnectOrCreate = (body.categories || []).map((name) => {
      const clean = name.trim();
      const slug = slugify(clean);
      return {
        where: { slug },
        create: { name: clean, slug },
      };
    });

    // Crear destino con relaciones
    const nuevoDestino = await prisma.destination.create({
      data: {
        name: body.name.trim(),
        country: body.country.trim(),
        city: body.city ? body.city.trim() : null,
        description: body.description ? body.description.trim() : null,
        isActive: body.isActive ?? true,
        imageUrl,

        membership: body.membership, // enum

        // precios (Decimal)
        priceUSDWithAirfare: new Prisma.Decimal(body.priceUSDWithAirfare),
        priceUSDWithoutAirfare: new Prisma.Decimal(body.priceUSDWithoutAirfare),
        priceCOPWithAirfare: new Prisma.Decimal(body.priceCOPWithAirfare),
        priceCOPWithoutAirfare: new Prisma.Decimal(body.priceCOPWithoutAirfare),
        baseFromUSD: body.baseFromUSD ? new Prisma.Decimal(body.baseFromUSD) : null,
        baseFromCOP: body.baseFromCOP ? new Prisma.Decimal(body.baseFromCOP) : null,

        // categorías M:N
        categories: { connectOrCreate: categoriesConnectOrCreate },

        // fechas 1:N
        tripDates: {
          create: body.tripDates.map((td) => ({
            startDate: new Date(td.startDate),
            endDate: new Date(td.endDate),
            isActive: td.isActive ?? true,
            notes: td.notes ?? null,
          })),
        },

        // Si aún mantienes los campos legados en la tabla (price/discountPrice),
        // simplemente NO los seteamos aquí. Puedes borrarlos del schema cuando migres del todo.
      },
      select: { id: true },
    });

    return NextResponse.json({ destination: nuevoDestino }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando destino:", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Payload inválido", issues: error.issues },
        { status: 400 }
      );
    }

    // Unicidad: @@unique([name, country, city])
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un destino con ese nombre/país/ciudad" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}
