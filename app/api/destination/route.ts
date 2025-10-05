import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { z } from "zod";
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

    const json = await req.json();
    const body = DestinationSchema.parse(json);

    const nuevoDestino = await prisma.destination.create({
      data: {
        businessId,
        name: body.name,
        country: body.country,
        city: body.city ?? null,
        description: body.description ?? null,
        category: body.category ?? null,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(nuevoDestino, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Payload inválido", issues: error.issues }, { status: 400 });
    }
    console.error("Error creando destino:", error);
    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const businessId = await getBusinessIdFromCookie();
    if (!businessId) {
      return NextResponse.json({ error: "No autenticado o sin empresa" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const active = searchParams.get("active"); 
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);
    const skip = Number(searchParams.get("skip") ?? 0);

    const where: any = { businessId };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
        take,
        skip,
      }),
      prisma.destination.count({ where }),
    ]);

    return NextResponse.json({ items, total }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo destinos:", error);
    return NextResponse.json({ error: "Error al obtener destinos" }, { status: 500 });
  }
}
