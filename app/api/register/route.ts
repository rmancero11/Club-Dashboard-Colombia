import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const allowedOrigin = "https://clubdeviajerossolteros.com";
const BUSINESS_SLUG_DEFAULT =
  process.env.BUSINESS_SLUG_DEFAULT ?? "clubdeviajeros";
const SELLER_DEFAULT_ID = process.env.SELLER_DEFAULT_ID || null;
const DASHBOARD_REDIRECT_URL =
  "https://clubsocial-phi.vercel.app/dashboard-user";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no esta definido en las variables de entorno");
}

const enc = new TextEncoder();

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "";
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "";
  try {
    if (origin !== allowedOrigin) {
      return NextResponse.json(
        { success: false, message: "Origin no permitido" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      country,
      whatsapp,
      presupuesto,
      preferencia,
      destino,
      password,
      businessSlug,
    } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y Contraseña son obligatorios" },
        { status: 200, headers: corsHeaders(origin) }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 200, headers: corsHeaders(origin) }
      );
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug ?? BUSINESS_SLUG_DEFAULT },
      select: { id: true },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          phone: whatsapp,
          country,
          budget: presupuesto,
          preference: preferencia,
          destino,
          password: hashedPassword,
          role: "USER",
          businessId: business?.id ?? null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          role: true,
          status: true,
          avatar: true,
          businessId: true,
          createdAt: true,
        },
      });

      let clientId: string | null = null;

      if (business?.id) {
        let seller = await tx.user.findFirst({
          where: { businessId: business.id, role: "SELLER", status: "ACTIVE" },
          orderBy: { sellerClients: { _count: "asc" } },
          select: { id: true },
        });

        if (!seller && SELLER_DEFAULT_ID) {
          const s = await tx.user.findUnique({
            where: { id: SELLER_DEFAULT_ID },
            select: { id: true, role: true, status: true },
          });
          if (s?.role === "SELLER" && s?.status === "ACTIVE") {
            seller = { id: s.id };
          }
        }

        if (seller) {
          const existingClient = await tx.client.findFirst({
            where: {
              businessId: business.id,
              OR: [{ email }, whatsapp ? { phone: whatsapp } : { id: "" }],
            },
            select: { id: true, userId: true },
          });

          const tags: string[] = [];
          if (preferencia) tags.push(`pref:${preferencia}`);
          if (destino) tags.push(`dest:${destino}`);
          const notes = [
            presupuesto ? `Presupuesto: ${presupuesto}` : null,
            destino ? `Destino de interés: ${destino}` : null,
            preferencia ? `Preferencias: ${preferencia}` : null,
          ]
            .filter(Boolean)
            .join(" | ");

          if (existingClient) {
            const updated = await tx.client.update({
              where: { id: existingClient.id },
              data: {
                userId: existingClient.userId ?? newUser.id,
                phone: whatsapp ?? undefined,
                country: country ?? undefined,
                tags: tags.length ? { push: tags } : undefined,
                notes: notes ? { set: notes } : undefined,
              },
              select: { id: true },
            });
            clientId = updated.id;
          } else {
            const created = await tx.client.create({
              data: {
                businessId: business.id,
                sellerId: seller.id,
                userId: newUser.id,
                name: name ?? email,
                email,
                phone: whatsapp ?? null,
                country: country ?? null,
                tags,
                notes: notes || null,
              },
              select: { id: true },
            });
            clientId = created.id;
          }

          await tx.activityLog.create({
            data: {
              businessId: business.id,
              action: "CREATE_CLIENT",
              message: `Alta/actualización desde WordPress: ${name ?? email}`,
              metadata: { destino, preferencia, presupuesto },
              userId: newUser.id,
              clientId: clientId!,
            },
          });
        } else {
          console.warn(
            "[register] No SELLER activo disponible; se creó solo User."
          );
        }
      } else {
        console.warn("[register] Business no encontrado; se creó solo User.");
      }

      return { newUser, clientId };
    });

    const token = await new SignJWT({
      sub: result.newUser.id,
      email: result.newUser.email,
      role: result.newUser.role,
      businessID: result.newUser.businessId ?? null,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(JWT_SECRET));

    const res = NextResponse.json(
      {
        success: true,
        usuario: result.newUser,
        clientId: result.clientId,
        redirectUrl: DASHBOARD_REDIRECT_URL,
      },
      { status: 201, headers: corsHeaders(origin) }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      ...(process.env.VERCEL ? { domain: "clubsocial-phi.vercel.app" } : {}),
    });

    return res;
  } catch (error) {
    console.error("Error al registrar:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
