import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { hashPassword } from "@/app/lib/hash";

type Body = {
  sellerId: string;

  // USER
  userEmail: string;
  userPassword: string;
  userName?: string | null;
  userPhone?: string | null;   // ya podría venir en E.164 del phone input
  userCountry?: string | null; // nombre de país (derivado de ISO)

  // CLIENT extra (sin duplicar)
  documentId?: string | null;
  city?: string | null;
  birthDate?: string | null; // yyyy-mm-dd
  tags?: string;             // coma-separado
  notes?: string | null;
  isArchived?: boolean;
};

function parseTags(raw?: string) {
  return (raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    if (auth.role !== "ADMIN") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const body = (await req.json()) as Body;

    // Validaciones básicas
    if (!body.sellerId) return NextResponse.json({ error: "sellerId es requerido." }, { status: 400 });
    if (!body.userEmail) return NextResponse.json({ error: "userEmail es requerido." }, { status: 400 });
    if (!body.userPassword || body.userPassword.length < 8)
      return NextResponse.json({ error: "userPassword mínimo 8 caracteres." }, { status: 400 });

    // Vendedor válido
    const seller = await prisma.user.findUnique({
      where: { id: body.sellerId },
      select: { id: true, role: true },
    });
    if (!seller || seller.role !== "SELLER") {
      return NextResponse.json({ error: "sellerId no corresponde a un vendedor válido." }, { status: 400 });
    }

    const birthDate = body.birthDate ? new Date(body.birthDate) : undefined;
    const tags = parseTags(body.tags);
    const passwordHash = await hashPassword(body.userPassword);

    const result = await prisma.$transaction(async (tx) => {
      // Crear USER (nuevo siempre)
      const newUser = await tx.user.create({
        data: {
          email: body.userEmail,
          password: passwordHash,
          name: body.userName || null,
          phone: body.userPhone || null,
          country: body.userCountry || null,
          role: "USER",
          status: "ACTIVE",
          verified: true,
        },
        select: { id: true, email: true, name: true, phone: true, country: true },
      });

      // Crear CLIENT (copiando email/phone/country desde user para no duplicar inputs)
      const newClient = await tx.client.create({
        data: {
          sellerId: body.sellerId,
          userId: newUser.id,
          name: body.userName || body.userEmail, // obligatorio en Client
          email: newUser.email,
          phone: newUser.phone,
          country: newUser.country,
          city: body.city || null,
          documentId: body.documentId || null,
          birthDate,
          tags,
          notes: body.notes || null,
          isArchived: !!body.isArchived,
        },
        select: {
          id: true, name: true, email: true, phone: true, country: true, city: true,
          documentId: true, birthDate: true, tags: true, isArchived: true, createdAt: true,
          sellerId: true, userId: true,
        },
      });

      // Log opcional
      await tx.activityLog.create({
        data: {
          action: "CREATE_CLIENT",
          message: "CLIENT_CREATED_WITH_NEW_USER",
          metadata: { createdBy: auth.userId, clientId: newClient.id, userId: newUser.id, sellerId: body.sellerId },
          userId: auth.userId,
          clientId: newClient.id,
        },
      }).catch(() => {});

      return { newUser, newClient };
    });

    return NextResponse.json({ ok: true, user: result.newUser, client: result.newClient }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Prisma unique constraint (p.ej. email duplicado)
      return NextResponse.json({ error: "El email ya está registrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno al crear el cliente." }, { status: 500 });
  }
}
