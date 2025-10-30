export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { pickSellerWeighted } from "@/app/lib/assignSeller";
import { parsePhoneNumberFromString } from "libphonenumber-js"; // sólo esto

const enc = new TextEncoder();

// === CONFIGURACIÓN ===
const WP_ALLOWED = new Set([
  "https://clubdeviajerossolteros.com",
  "https://www.clubdeviajerossolteros.com",
]);
const BASE_DASHBOARD = "https://dashboard.clubdeviajerossolteros.com";

// === HELPERS ===
function normalizeOrigin(o: string | null) {
  return o ? o.replace(/\/$/, "") : null;
}

function corsHeaders(origin: string | null) {
  const o = normalizeOrigin(origin);
  const allow =
    o && WP_ALLOWED.has(o) ? o : "https://clubdeviajerossolteros.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as Record<string, string>;
}

/**
 * Normaliza un teléfono a E.164 cuando es posible.
 * - Si `phone` ya empieza con '+' intentamos parsear directamente.
 * - Si no empieza con '+', y `countryDialCode` es un dial code (ej '54'), construimos +{countryDialCode}{phone} y parseamos.
 * - Si falla, devolvemos `phone` tal cual.
 *
 * Nota: no usaremos CountryCode de libphonenumber-js para evitar TS2345.
 */
async function sendToClientify(data: Record<string, any>) {
  try {
    const CLIENTIFY_WEBFORM_ID = "262806"; // ID de tu formulario Clientify
    const CLIENTIFY_URL = `https://api.clientify.net/web-marketing/webforms/external/submit/${CLIENTIFY_WEBFORM_ID}/`;

    const response = await fetch(CLIENTIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error enviando a Clientify:", errorText);
    } else {
      console.log("✅ Datos enviados a Clientify correctamente");
    }
  } catch (error) {
    console.error("⚠️ Error en la conexión con Clientify:", error);
  }
}

function normalizePhone(phone: string | null, countryDialCode: string | null) {
  if (!phone) return null;

  try {
    const raw = String(phone).trim();

    // Si ya viene en E.164 (ej "+54911..."), parseamos directo
    if (raw.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(raw);
      return parsed ? parsed.number : raw;
    }

    // Si tenemos un country dial code (p.e. '54' o '1'), intentamos construir +{dial}{phone}
    const dial = countryDialCode
      ? String(countryDialCode).replace(/\D/g, "")
      : "";
    if (dial) {
      // quitamos ceros a la izquierda del celular local si vinieran
      const candidate = `+${dial}${raw.replace(/^0+/, "")}`;
      const parsed = parsePhoneNumberFromString(candidate);
      if (parsed && parsed.isValid && parsed.isValid()) return parsed.number;
      // si no es válido, intentamos parsear sin modificar
      const parsed2 = parsePhoneNumberFromString(raw);
      if (parsed2 && parsed2.isValid && parsed2.isValid())
        return parsed2.number;
      // fallback al candidate sin validación estricta
      return parsed?.number || candidate;
    }

    // Si no tenemos dial, intentamos parsear el raw (quizá incluye código)
    const parsed = parsePhoneNumberFromString(raw);
    return parsed ? parsed.number : raw;
  } catch {
    return phone;
  }
}

// === HANDLER OPTIONS ===
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// === HANDLER POST ===
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const normalized = normalizeOrigin(origin);
    if (!normalized || !WP_ALLOWED.has(normalized)) {
      return NextResponse.json(
        {
          success: false,
          message: "Origin no permitido",
          originRecibido: normalized ?? null,
        },
        { status: 403, headers }
      );
    }

    // 🔹 1. Lectura del body (JSON o FormData / urlencoded)
    let body: any;
    const contentType = String(
      req.headers.get("content-type") || ""
    ).toLowerCase();
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const form = await req.formData();
      // formData values pueden ser File o string; convertimos a string donde haga falta
      body = Object.fromEntries(
        Array.from(form.entries()).map(([k, v]) => [
          k,
          typeof v === "string" ? v : v,
        ])
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Tipo de contenido no soportado" },
        { status: 400, headers }
      );
    }

    // 🔹 2. Extraer campos (mapeo esperado desde tu formulario)
    const {
      name,
      email,
      country,
      country_code, // hidden -> dial code (ej '54')
      whatsapp, // hidden E.164 o campo 'phone' dependiendo de lo que envíe el formulario
      phone, // a veces el formulario envía phone en vez de whatsapp
      destino,
      password,
      comentario,
      soltero,
      afirmacion,
      gustos,
      acepta_terminos,
      flujo,
    } = body ?? {};

    // Aceptar whatsapp o phone según lo que llegue
    const rawPhone = whatsapp || phone || null;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son obligatorios" },
        { status: 400, headers }
      );
    }

    // 🔹 3. Normalización de datos
    const emailNorm = String(email).toLowerCase().trim();
    const phoneNorm = normalizePhone(rawPhone, country_code || null);

    const exists = await prisma.user.findUnique({
      where: { email: emailNorm },
    });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 409, headers }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const toArray = (value: any) => {
      if (value == null) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        // si viene coma-separado -> split, si viene vacío -> []
        if (value.trim() === "") return [];
        if (value.includes(","))
          return value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        return [value];
      }
      return [String(value)];
    };

    // 🔹 4. Transacción Prisma
    const { newUser, clientId } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: emailNorm,
          name: name ?? null,
          phone: phoneNorm,
          country: country ?? null,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
          comment: comentario ?? null,
          singleStatus: soltero ?? null,
          affirmation: afirmacion ?? null,
          destino: toArray(destino),
          preference: toArray(gustos),
          acceptedTerms:
            acepta_terminos === "on" ||
            acepta_terminos === true ||
            acepta_terminos === "true",
          flow: flujo ?? null,
          timezone: "America/Bogota",
          verified: false,
        },
        select: { id: true, email: true, name: true },
      });

      const sellerId = await pickSellerWeighted(tx);
      const createdClient = await tx.client.create({
        data: {
          userId: createdUser.id,
          sellerId: sellerId ?? null,
          name: name || emailNorm,
          email: createdUser.email,
          phone: phoneNorm ?? null,
          country: country ?? null,
          city: null,
          notes: comentario ?? null,
          tags: [],
          isArchived: false,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          action: "LEAD_ASSIGNED",
          message: "Client creado y asignado automáticamente",
          userId: createdUser.id,
          clientId: createdClient.id,
          metadata: {
            sellerId: sellerId ?? null,
            flujo: flujo ?? null,
            destino: destino ?? null,
            auto: true,
          },
        },
      });

      return { newUser: createdUser, clientId: createdClient.id };
    });

    // 🔹 5. Crear token y redirect
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("[REGISTER] JWT_SECRET faltante");
      return NextResponse.json(
        { success: false, message: "Config JWT faltante" },
        { status: 500, headers }
      );
    }

    const onboardToken = await new SignJWT({
      sub: newUser.id,
      purpose: "onboard",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(enc.encode(JWT_SECRET));

    const redirectUrl =
      `${BASE_DASHBOARD}/api/auth/accept-register` +
      `?r=${encodeURIComponent(onboardToken)}&next=/dashboard-user`;
    // 🔹 6. Enviar datos a Clientify
    await sendToClientify({
      name,
      email,
      phone: phoneNorm,
      country,
      aria_code: country_code || null, // acá se envía el código ARIA (ej. "AR")
      destino: Array.isArray(destino) ? destino.join(", ") : destino,
      gustos: Array.isArray(gustos) ? gustos.join(", ") : gustos,
      comentario,
      soltero,
      afirmacion,
      flujo,
    });

    return NextResponse.redirect(redirectUrl, {
      status: 303, // “See Other” para redirigir después de un POST
      headers,
    });
  } catch (err) {
    console.error("Error en /api/register:", err);
    return NextResponse.json(
      { success: false, error: "Error al registrar" },
      { status: 500, headers }
    );
  }
}

export {};
