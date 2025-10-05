import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "";
const enc = new TextEncoder();

async function signToken(payload: Record<string, unknown>, exp = "1d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(enc.encode(JWT_SECRET));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSlug(base: string) {
  let s = slugify(base) || "mi-empresa";
  let n = 1;
  while (await prisma.business.findUnique({ where: { slug: s } })) {
    n += 1;
    s = `${slugify(base)}-${n}`;
  }
  return s;
}

const RESERVED = new Set(["admin", "dashboard", "api", "app", "www"]);

export async function POST(req: Request) {
  try {
    const { businessName, country, ownerName, email, password } = await req.json();

    if (!businessName || !email || !password || !ownerName) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }

    const baseSlug = slugify(businessName);
    if (RESERVED.has(baseSlug)) {
      return NextResponse.json({ error: "Nombre no disponible" }, { status: 400 });
    }
    const slug = await uniqueSlug(businessName);

    const hashed = await bcrypt.hash(password, 10);

    const { business, admin } = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          Name: businessName,
          slug,
          country: country ?? null,
        },
        select: { id: true, slug: true, Name: true }
      });

      const admin = await tx.user.create({
        data: {
          email,
          name: ownerName,
          country: country ?? null,
          password: hashed,
          role: "ADMIN",
          status: "ACTIVE",
          businessId: business.id,
          timezone: "America/Bogota",
        },
        select: { id: true, email: true, role: true, businessId: true, name: true }
      });

      await tx.activityLog.create({
        data: {
          businessId: business.id,
          action: "GENERATE_REPORT", 
          message: `Empresa creada y admin ${ownerName} (${email}) registrado`,
          metadata: { slug: business.slug },
          userId: admin.id,
        }
      });

      return { business, admin };
    });

    const token = await signToken({
      id: admin.id,
      role: admin.role,
      businessId: admin.businessId,
    });

    const res = NextResponse.json({
      business: { id: business.id, slug: business.slug, name: business.Name },
      user: { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err) {
    console.error("Error creando empresa:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
