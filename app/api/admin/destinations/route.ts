import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { getAuth } from "@/app/lib/auth";

/* ================= Helpers ================= */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normDec = (v: FormDataEntryValue | null) =>
  v == null ? undefined : String(v).replace(",", ".").trim();

const TripDateSchema = z.object({
  startDate: z.string().min(1, "startDate requerido"),
  endDate: z.string().min(1, "endDate requerido"),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

/** FormData -> objeto crudo para Zod */
async function readForm(req: Request) {
  const fd = await req.formData();

  return {
    name: fd.get("name"),
    country: fd.get("country"),
    city: fd.get("city") ?? undefined,
    description: fd.get("description") ?? undefined,
    membership: (fd.get("membership") as string) || "STANDARD",
    categories: (fd.get("categories") as string) || "[]",

    // Precios finales (compat)
    priceUSDWithAirfare: normDec(fd.get("priceUSDWithAirfare")),
    priceUSDWithoutAirfare: normDec(fd.get("priceUSDWithoutAirfare")),
    priceCOPWithAirfare: normDec(fd.get("priceCOPWithAirfare")),
    priceCOPWithoutAirfare: normDec(fd.get("priceCOPWithoutAirfare")),

    // Lista (sin descuento)
    listUSDWithAirfare: normDec(fd.get("listUSDWithAirfare")),
    listUSDWithoutAirfare: normDec(fd.get("listUSDWithoutAirfare")),
    listCOPWithAirfare: normDec(fd.get("listCOPWithAirfare")),
    listCOPWithoutAirfare: normDec(fd.get("listCOPWithoutAirfare")),

    // % descuento
    discountUSDWithAirfarePercent: normDec(fd.get("discountUSDWithAirfarePercent")),
    discountUSDWithoutAirfarePercent: normDec(fd.get("discountUSDWithoutAirfarePercent")),
    discountCOPWithAirfarePercent: normDec(fd.get("discountCOPWithAirfarePercent")),
    discountCOPWithoutAirfarePercent: normDec(fd.get("discountCOPWithoutAirfarePercent")),

    // “Desde”
    baseFromUSD: normDec(fd.get("baseFromUSD")),
    baseFromCOP: normDec(fd.get("baseFromCOP")),

    tripDates: (fd.get("tripDates") as string) || "[]",
    isActive: (fd.get("isActive") as string) === "true",

    image: fd.get("image"),
  };
}

/* ================= Zod Schemas ================= */

const decimal2 = /^\d+(\.\d{1,2})?$/;
const decimal14_2 = /^\d+(\.\d{1,2})?$/; // COP 2 decimales máx

const PayloadSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  description: z.string().optional(),
  membership: z.enum(["STANDARD", "PREMIUM", "VIP"]).optional().default("STANDARD"),

  categories: z
    .string()
    .transform((s) => (s ? (JSON.parse(s) as unknown) : []))
    .pipe(z.array(z.string().min(1)).optional().default([])),

  // Finales USD (compat)
  priceUSDWithAirfare: z.string().optional().refine(v => v === undefined || decimal2.test(v), "USD con aéreo inválido"),
  priceUSDWithoutAirfare: z.string().optional().refine(v => v === undefined || decimal2.test(v), "USD sin aéreo inválido"),

  // Finales COP (compat)
  priceCOPWithAirfare: z.string().optional().refine(v => v === undefined || decimal14_2.test(v), "COP con aéreo inválido"),
  priceCOPWithoutAirfare: z.string().optional().refine(v => v === undefined || decimal14_2.test(v), "COP sin aéreo inválido"),

  // Lista USD/COP
  listUSDWithAirfare: z.string().optional(),
  listUSDWithoutAirfare: z.string().optional(),
  listCOPWithAirfare: z.string().optional(),
  listCOPWithoutAirfare: z.string().optional(),

  // % descuento
  discountUSDWithAirfarePercent: z.string().optional(),
  discountUSDWithoutAirfarePercent: z.string().optional(),
  discountCOPWithAirfarePercent: z.string().optional(),
  discountCOPWithoutAirfarePercent: z.string().optional(),

  // “Desde”
  baseFromUSD: z.string().optional(),
  baseFromCOP: z.string().optional(),

  tripDates: z
    .string()
    .transform((s) => (s ? (JSON.parse(s) as unknown) : []))
    .pipe(z.array(TripDateSchema).optional().default([])),

  isActive: z.boolean().optional().default(true),
})
  // Reglas: al menos un precio USD y al menos un precio COP (sea lista/% o final)
  .superRefine((val, ctx) => {
    const hasUSD =
      !!val.listUSDWithAirfare || !!val.listUSDWithoutAirfare ||
      !!val.priceUSDWithAirfare || !!val.priceUSDWithoutAirfare;
    const hasCOP =
      !!val.listCOPWithAirfare || !!val.listCOPWithoutAirfare ||
      !!val.priceCOPWithAirfare || !!val.priceCOPWithoutAirfare;
    if (!hasUSD) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe enviar al menos un precio en USD (lista/% o final)", path: ["listUSDWithAirfare"] });
    if (!hasCOP) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe enviar al menos un precio en COP (lista/% o final)", path: ["listCOPWithAirfare"] });
  });

/* ======= Lógica de cálculo server-side (igual que PATCH) ======= */

const clampPercent = (v?: string) => {
  if (v == null || v === "") return null;
  const n = Math.max(0, Math.min(99.99, Number(v)));
  return Number.isFinite(n) ? n : null;
};
const calcFinalUSD = (list: number, disc: number | null) =>
  Number((list * (1 - ((disc ?? 0) / 100))).toFixed(2));
const calcFinalCOP = (list: number, disc: number | null) =>
  Math.max(0, Math.round(list * (1 - ((disc ?? 0) / 100))));

function applyUSDGroupCreate(body: any, into: any) {
  const lw = body.listUSDWithAirfare;
  const pw = body.priceUSDWithAirfare;
  const dw = clampPercent(body.discountUSDWithAirfarePercent);

  const lwo = body.listUSDWithoutAirfare;
  const pwo = body.priceUSDWithoutAirfare;
  const dwo = clampPercent(body.discountUSDWithoutAirfarePercent);

  // WITH AIRFARE
  if (lw) {
    const lNum = Number(lw);
    into.listUSDWithAirfare = new Prisma.Decimal(lw);
    into.discountUSDWithAirfarePercent = dw == null ? null : new Prisma.Decimal(dw.toString());
    into.priceUSDWithAirfare = new Prisma.Decimal(calcFinalUSD(lNum, dw).toString());
  } else if (pw) {
    into.priceUSDWithAirfare = new Prisma.Decimal(pw);
    if (dw != null) into.discountUSDWithAirfarePercent = new Prisma.Decimal(dw.toString());
  }

  // WITHOUT AIRFARE
  if (lwo) {
    const lNum = Number(lwo);
    into.listUSDWithoutAirfare = new Prisma.Decimal(lwo);
    into.discountUSDWithoutAirfarePercent = dwo == null ? null : new Prisma.Decimal(dwo.toString());
    into.priceUSDWithoutAirfare = new Prisma.Decimal(calcFinalUSD(lNum, dwo).toString());
  } else if (pwo) {
    into.priceUSDWithoutAirfare = new Prisma.Decimal(pwo);
    if (dwo != null) into.discountUSDWithoutAirfarePercent = new Prisma.Decimal(dwo.toString());
  }
}

function applyCOPGroupCreate(body: any, into: any) {
  const lw = body.listCOPWithAirfare;
  const pw = body.priceCOPWithAirfare;
  const dw = clampPercent(body.discountCOPWithAirfarePercent);

  const lwo = body.listCOPWithoutAirfare;
  const pwo = body.priceCOPWithoutAirfare;
  const dwo = clampPercent(body.discountCOPWithoutAirfarePercent);

  // WITH AIRFARE
  if (lw) {
    const lNum = Number(lw);
    into.listCOPWithAirfare = new Prisma.Decimal(lw);
    into.discountCOPWithAirfarePercent = dw == null ? null : new Prisma.Decimal(dw.toString());
    into.priceCOPWithAirfare = new Prisma.Decimal(calcFinalCOP(lNum, dw).toString());
  } else if (pw) {
    into.priceCOPWithAirfare = new Prisma.Decimal(pw);
    if (dw != null) into.discountCOPWithAirfarePercent = new Prisma.Decimal(dw.toString());
  }

  // WITHOUT AIRFARE
  if (lwo) {
    const lNum = Number(lwo);
    into.listCOPWithoutAirfare = new Prisma.Decimal(lwo);
    into.discountCOPWithoutAirfarePercent = dwo == null ? null : new Prisma.Decimal(dwo.toString());
    into.priceCOPWithoutAirfare = new Prisma.Decimal(calcFinalCOP(lNum, dwo).toString());
  } else if (pwo) {
    into.priceCOPWithoutAirfare = new Prisma.Decimal(pwo);
    if (dwo != null) into.discountCOPWithoutAirfarePercent = new Prisma.Decimal(dwo.toString());
  }
}

/* ================= Route: POST ================= */

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const raw = await readForm(req);
    const body = PayloadSchema.parse(raw);

    // Validar fechas (start <= end)
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
    if (raw.image && raw.image instanceof File && raw.image.size > 0) {
      const up: any = await uploadToCloudinary(raw.image);
      imageUrl = up.secure_url as string;
    }

    // Conectar/crear categorías por slug (name=slug original)
    const categoriesConnectOrCreate = (body.categories || []).map((slugOrName) => {
      const clean = slugOrName.trim();
      const slug = slugify(clean);
      return { where: { slug }, create: { name: clean, slug } };
    });

    // Base de datos del destino (sin precios aún)
    const data: Prisma.DestinationCreateInput = {
      name: body.name.trim(),
      country: body.country.trim(),
      city: body.city ? body.city.trim() : null,
      description: body.description ? body.description.trim() : null,
      isActive: body.isActive ?? true,
      imageUrl,
      membership: body.membership,

      // “Desde”
      baseFromUSD: body.baseFromUSD ? new Prisma.Decimal(body.baseFromUSD) : null,
      baseFromCOP: body.baseFromCOP ? new Prisma.Decimal(body.baseFromCOP) : null,

      // categorías
      categories: { connectOrCreate: categoriesConnectOrCreate },

      // fechas
      tripDates: {
        create: body.tripDates.map((td) => ({
          startDate: new Date(td.startDate),
          endDate: new Date(td.endDate),
          isActive: td.isActive ?? true,
          notes: td.notes ?? null,
        })),
      },
    };

    // Aplicar grupos de precio (lista/% → final), con compat para price*
    applyUSDGroupCreate(body, data);
    applyCOPGroupCreate(body, data);

    const created = await prisma.destination.create({
      data,
      select: { id: true },
    });

    return NextResponse.json({ destination: created }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando destino:", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Payload inválido", issues: error.issues },
        { status: 400 }
      );
    }
    if (error?.code === "P2002") {
      // Unicidad: @@unique([name, country, city])
      return NextResponse.json(
        { error: "Ya existe un destino con ese nombre/país/ciudad" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}
