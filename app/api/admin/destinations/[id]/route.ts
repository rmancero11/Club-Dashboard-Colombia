import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= Helpers ================= */

function toBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "on" || s === "yes";
  }
  return false;
}
function toDecimalOrUndef(v: unknown) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function toDecimalOrNull(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
}
function toDecimalOrLeave(v: unknown) {
  // undefined: no cambiar; null: limpiar; número: asignar
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const clampPercentNum = (v: number | null | undefined) =>
  v == null ? null : Number(Math.max(0, Math.min(99.99, v)).toFixed(2));

const inferDiscount = (list?: number | null, price?: number | null) => {
  if (list == null || price == null || list <= 0 || price <= 0 || price > list) return null;
  return clampPercentNum(((list - price) / list) * 100);
};

const calcFinalUSD = (list: number, disc: number | null | undefined) =>
  Number((list * (1 - ((disc ?? 0) / 100))).toFixed(2));
const calcFinalCOP = (list: number, disc: number | null | undefined) =>
  Math.max(0, Math.round(list * (1 - ((disc ?? 0) / 100))));

function tryExtractPublicIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return null;
    const after = parts.slice(idx + 2).join("/"); // salta v<version>
    const noExt = after.replace(/\.[a-z0-9]+$/i, "");
    return noExt || null;
  } catch {
    return null;
  }
}

type TripDateIncoming = {
  id?: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  isActive: boolean;
  notes?: string;
};

async function applyCategoriesBySlugs(destId: string, slugs: string[]) {
  const unique = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
  if (unique.length === 0) {
    await prisma.destination.update({
      where: { id: destId },
      data: { categories: { set: [] } },
      select: { id: true },
    });
    return;
  }
  const cats = await prisma.category.findMany({
    where: { slug: { in: unique } },
    select: { id: true, slug: true },
  });
  if (cats.length === 0) return;
  await prisma.destination.update({
    where: { id: destId },
    data: { categories: { set: cats.map((c) => ({ id: c.id })) } },
    select: { id: true },
  });
}

async function applyTripDates(destId: string, incoming: TripDateIncoming[]) {
  const normalize = (d: string) => new Date(d + "T00:00:00.000Z");

  const current = await prisma.tripDate.findMany({
    where: { destinationId: destId },
    select: { id: true },
  });
  const currentIds = new Set(current.map((t) => t.id));
  const incomingIds = new Set((incoming || []).map((t) => t.id).filter(Boolean) as string[]);

  const toDelete: string[] = [];
  currentIds.forEach((id) => {
    if (!incomingIds.has(id)) toDelete.push(id);
  });
  if (toDelete.length > 0) {
    await prisma.tripDate.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const td of incoming) {
    const data = {
      startDate: normalize(td.startDate),
      endDate: normalize(td.endDate),
      isActive: !!td.isActive,
      notes: td.notes?.trim() || null,
      destinationId: destId,
    };
    if (td.id) {
      await prisma.tripDate.update({ where: { id: td.id }, data });
    } else {
      await prisma.tripDate.create({ data });
    }
  }
}

/* ================ Core price assigners (con inferencia) ================ */
/**
 * Reglas:
 * - Si llega LISTA (list*) se respeta y se guarda tal cual.
 *   - Si llega también %, el FINAL se recalcula desde LISTA y %.
 *   - Si NO llega %, pero llega FINAL (price*), se INFIERTE el % desde (lista, final) y se guarda el final.
 *   - Si NO llega % NI FINAL, el FINAL queda = LISTA (equivale a 0%).
 * - Si NO llega LISTA, pero llega FINAL (price*), se respeta FINAL; si llega % sin lista, solo se guarda el %.
 * - USD redondea a 2 decimales, COP a entero.
 */
function applyUSDGroup(opts: {
  into: any;
  listWith: number | null | undefined;
  priceWith: number | null | undefined;
  discWith: number | null | undefined;
  listWithout: number | null | undefined;
  priceWithout: number | null | undefined;
  discWithout: number | null | undefined;
}) {
  const {
    into,
    listWith, priceWith, discWith,
    listWithout, priceWithout, discWithout
  } = opts;

  // WITH AIRFARE
  let dW = clampPercentNum(discWith);
  if (listWith !== undefined) {
    into.listUSDWithAirfare = listWith;
    if (dW == null && priceWith != null) dW = inferDiscount(listWith!, priceWith!);
    into.discountUSDWithAirfarePercent = dW;
    if (dW != null) into.priceUSDWithAirfare = calcFinalUSD(listWith!, dW);
    else if (priceWith !== undefined) into.priceUSDWithAirfare = Number(priceWith);
    else into.priceUSDWithAirfare = Number(listWith);
  } else {
    if (priceWith !== undefined) into.priceUSDWithAirfare = Number(priceWith);
    if (dW != null) into.discountUSDWithAirfarePercent = dW;
  }

  // WITHOUT AIRFARE
  let dWo = clampPercentNum(discWithout);
  if (listWithout !== undefined) {
    into.listUSDWithoutAirfare = listWithout;
    if (dWo == null && priceWithout != null) dWo = inferDiscount(listWithout!, priceWithout!);
    into.discountUSDWithoutAirfarePercent = dWo;
    if (dWo != null) into.priceUSDWithoutAirfare = calcFinalUSD(listWithout!, dWo);
    else if (priceWithout !== undefined) into.priceUSDWithoutAirfare = Number(priceWithout);
    else into.priceUSDWithoutAirfare = Number(listWithout);
  } else {
    if (priceWithout !== undefined) into.priceUSDWithoutAirfare = Number(priceWithout);
    if (dWo != null) into.discountUSDWithoutAirfarePercent = dWo;
  }
}

function applyCOPGroup(opts: {
  into: any;
  listWith: number | null | undefined;
  priceWith: number | null | undefined;
  discWith: number | null | undefined;
  listWithout: number | null | undefined;
  priceWithout: number | null | undefined;
  discWithout: number | null | undefined;
}) {
  const {
    into,
    listWith, priceWith, discWith,
    listWithout, priceWithout, discWithout
  } = opts;

  // WITH AIRFARE
  let dW = clampPercentNum(discWith);
  if (listWith !== undefined) {
    into.listCOPWithAirfare = listWith;
    if (dW == null && priceWith != null) dW = inferDiscount(listWith!, priceWith!);
    into.discountCOPWithAirfarePercent = dW;
    if (dW != null) into.priceCOPWithAirfare = calcFinalCOP(listWith!, dW);
    else if (priceWith !== undefined) into.priceCOPWithAirfare = Math.round(Number(priceWith));
    else into.priceCOPWithAirfare = Math.round(Number(listWith));
  } else {
    if (priceWith !== undefined) into.priceCOPWithAirfare = Math.round(Number(priceWith));
    if (dW != null) into.discountCOPWithAirfarePercent = dW;
  }

  // WITHOUT AIRFARE
  let dWo = clampPercentNum(discWithout);
  if (listWithout !== undefined) {
    into.listCOPWithoutAirfare = listWithout;
    if (dWo == null && priceWithout != null) dWo = inferDiscount(listWithout!, priceWithout!);
    into.discountCOPWithoutAirfarePercent = dWo;
    if (dWo != null) into.priceCOPWithoutAirfare = calcFinalCOP(listWithout!, dWo);
    else if (priceWithout !== undefined) into.priceCOPWithoutAirfare = Math.round(Number(priceWithout));
    else into.priceCOPWithoutAirfare = Math.round(Number(listWithout));
  } else {
    if (priceWithout !== undefined) into.priceCOPWithoutAirfare = Math.round(Number(priceWithout));
    if (dWo != null) into.discountCOPWithoutAirfarePercent = dWo;
  }
}

/* ================ PATCH ================ */

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = params.id;
  const contentType = req.headers.get("content-type") || "";
  const data: any = {};
  let usedMultipart = false;

  try {
    if (contentType.includes("multipart/form-data")) {
      usedMultipart = true;
      const form = await req.formData();

      const name = form.get("name");
      const country = form.get("country");
      const city = form.get("city");
      const description = form.get("description");
      const membership = form.get("membership"); // STANDARD | PREMIUM | VIP
      const isActive = form.get("isActive");

      if (typeof name === "string") data.name = name.trim();
      if (typeof country === "string") data.country = country.trim();
      if (city === null || typeof city === "string") data.city = city ? city.trim() : null;
      if (description === null || typeof description === "string")
        data.description = description ? description.trim() : null;
      if (typeof membership === "string" && ["STANDARD", "PREMIUM", "VIP"].includes(membership))
        data.membership = membership as any;
      if (isActive !== null) data.isActive = toBool(isActive);

      // ======== USD (lista/%/final) ========
      const priceUSDWithAirfareIn = toDecimalOrLeave(form.get("priceUSDWithAirfare"));
      const priceUSDWithoutAirfareIn = toDecimalOrLeave(form.get("priceUSDWithoutAirfare"));
      const listUSDWithAirfare = toDecimalOrLeave(form.get("listUSDWithAirfare"));
      const listUSDWithoutAirfare = toDecimalOrLeave(form.get("listUSDWithoutAirfare"));
      const discUSDWithAirfare = toDecimalOrLeave(form.get("discountUSDWithAirfarePercent"));
      const discUSDWithoutAirfare = toDecimalOrLeave(form.get("discountUSDWithoutAirfarePercent"));

      applyUSDGroup({
        into: data,
        listWith: listUSDWithAirfare,
        priceWith: priceUSDWithAirfareIn,
        discWith: discUSDWithAirfare,
        listWithout: listUSDWithoutAirfare,
        priceWithout: priceUSDWithoutAirfareIn,
        discWithout: discUSDWithoutAirfare,
      });

      // ======== COP (lista/%/final) ========
      const priceCOPWithAirfareIn = toDecimalOrLeave(form.get("priceCOPWithAirfare"));
      const priceCOPWithoutAirfareIn = toDecimalOrLeave(form.get("priceCOPWithoutAirfare"));
      const listCOPWithAirfare = toDecimalOrLeave(form.get("listCOPWithAirfare"));
      const listCOPWithoutAirfare = toDecimalOrLeave(form.get("listCOPWithoutAirfare"));
      const discCOPWithAirfare = toDecimalOrLeave(form.get("discountCOPWithAirfarePercent"));
      const discCOPWithoutAirfare = toDecimalOrLeave(form.get("discountCOPWithoutAirfarePercent"));

      applyCOPGroup({
        into: data,
        listWith: listCOPWithAirfare,
        priceWith: priceCOPWithAirfareIn,
        discWith: discCOPWithAirfare,
        listWithout: listCOPWithoutAirfare,
        priceWithout: priceCOPWithoutAirfareIn,
        discWithout: discCOPWithoutAirfare,
      });

      // “Desde”
      const baseFromUSD = toDecimalOrLeave(form.get("baseFromUSD"));
      const baseFromCOP = toDecimalOrLeave(form.get("baseFromCOP"));
      if (baseFromUSD !== undefined) data.baseFromUSD = baseFromUSD;
      if (baseFromCOP !== undefined) data.baseFromCOP = baseFromCOP;

      // ====== Categorías (array de slugs) ======
      const catsRaw = form.get("categories"); // JSON.stringify(string[])
      let categorySlugs: string[] | null = null;
      if (typeof catsRaw === "string" && catsRaw.trim()) {
        try {
          const arr = JSON.parse(catsRaw);
          if (Array.isArray(arr)) categorySlugs = arr as string[];
        } catch {}
      }

      // ====== TripDates (array) ======
      const tripDatesRaw = form.get("tripDates"); // JSON.stringify(TripDateState[])
      let incomingTripDates: TripDateIncoming[] | null = null;
      if (typeof tripDatesRaw === "string" && tripDatesRaw.trim()) {
        try {
          const arr = JSON.parse(tripDatesRaw);
          if (Array.isArray(arr)) {
            incomingTripDates = arr.map((t: any) => ({
              id: t.id || undefined,
              startDate: String(t.startDate),
              endDate: String(t.endDate),
              isActive: !!t.isActive,
              notes: t.notes ? String(t.notes) : undefined,
            }));
          }
        } catch {}
      }

      // ====== Imagen ======
      const image =
        (form.get("image") as File | null) ??
        (form.get("file") as File | null) ??
        null;

      if (image && image.size > 0) {
        const mime = (image as any).type || "";
        const originalName = (image as any).name || "image";
        const isVideo = mime.startsWith("video/");
        const isPdf = mime === "application/pdf" || /\.pdf$/i.test(originalName);

        const publicId = `clubviajeros/destinations/${id}-${Date.now()}`;

        const uploaded = await uploadToCloudinary(image, {
          resource_type: isVideo ? "video" : isPdf ? "image" : "image",
          access: "public",
          filename: originalName,
          cloudinary: {
            type: "upload",
            public_id: publicId,
            overwrite: false,
            ...(isPdf ? { format: "pdf" } : {}),
            context: {
              destinationId: id,
              role: auth.role,
              userId: auth.userId,
            },
            tags: ["clubviajeros", "destinations", `destination:${id}`],
          },
        });

        data.imageUrl = uploaded.secure_url;
      }

      // ====== Guardado principal ======
      const updated = await prisma.destination.update({
        where: { id },
        data,
        select: { id: true },
      });

      if (categorySlugs) {
        await applyCategoriesBySlugs(id, categorySlugs);
      }
      if (incomingTripDates) {
        await applyTripDates(id, incomingTripDates);
      }

      return NextResponse.json({ ok: true, id: updated.id, usedMultipart: true });
    } else {
      // ===== JSON =====
      const body = await req.json().catch(() => ({}));

      // Básicos
      if (typeof body.name === "string") data.name = body.name.trim();
      if (typeof body.country === "string") data.country = body.country.trim();
      if (body.city === null || typeof body.city === "string")
        data.city = body.city ? String(body.city).trim() : null;
      if (body.description === null || typeof body.description === "string")
        data.description = body.description ? String(body.description).trim() : null;
      if (typeof body.membership === "string" && ["STANDARD", "PREMIUM", "VIP"].includes(body.membership))
        data.membership = body.membership;
      if (body.isActive !== undefined) data.isActive = toBool(body.isActive);

      // ======== USD (JSON) ========
      applyUSDGroup({
        into: data,
        listWith: toDecimalOrLeave(body.listUSDWithAirfare),
        priceWith: toDecimalOrLeave(body.priceUSDWithAirfare),
        discWith: toDecimalOrLeave(body.discountUSDWithAirfarePercent),
        listWithout: toDecimalOrLeave(body.listUSDWithoutAirfare),
        priceWithout: toDecimalOrLeave(body.priceUSDWithoutAirfare),
        discWithout: toDecimalOrLeave(body.discountUSDWithoutAirfarePercent),
      });

      // ======== COP (JSON) ========
      applyCOPGroup({
        into: data,
        listWith: toDecimalOrLeave(body.listCOPWithAirfare),
        priceWith: toDecimalOrLeave(body.priceCOPWithAirfare),
        discWith: toDecimalOrLeave(body.discountCOPWithAirfarePercent),
        listWithout: toDecimalOrLeave(body.listCOPWithoutAirfare),
        priceWithout: toDecimalOrLeave(body.priceCOPWithoutAirfare),
        discWithout: toDecimalOrLeave(body.discountCOPWithoutAirfarePercent),
      });

      // “Desde”
      if ("baseFromUSD" in body) data.baseFromUSD = toDecimalOrLeave(body.baseFromUSD);
      if ("baseFromCOP" in body) data.baseFromCOP = toDecimalOrLeave(body.baseFromCOP);

      // Legado (opcional, compat)
      if ("price" in body) data.price = toDecimalOrUndef(body.price);
      if ("discountPrice" in body) data.discountPrice = toDecimalOrNull(body.discountPrice);
      if (typeof body.imageUrl === "string" && body.imageUrl.trim())
        data.imageUrl = body.imageUrl.trim();

      // Guardar campos escalares
      const updated = await prisma.destination.update({
        where: { id },
        data,
        select: { id: true },
      });

      // Categorías por slug
      if (Array.isArray(body.categories)) {
        await applyCategoriesBySlugs(id, body.categories as string[]);
      }

      // TripDates
      if (Array.isArray(body.tripDates)) {
        const incoming: TripDateIncoming[] = body.tripDates.map((t: any) => ({
          id: t.id || undefined,
          startDate: String(t.startDate),
          endDate: String(t.endDate),
          isActive: !!t.isActive,
          notes: t.notes ? String(t.notes) : undefined,
        }));
        await applyTripDates(id, incoming);
      }

      return NextResponse.json({ ok: true, id: updated.id, usedMultipart: false });
    }
  } catch (e: any) {
    console.error("[destinations:PATCH] error:", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Conflicto de único (nombre/país/ciudad)" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "No se pudo actualizar", details: e?.message || String(e), usedMultipart },
      { status: 400 }
    );
  }
}

/* ================ DELETE ================ */

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const dest = await prisma.destination.findUnique({
      where: { id: params.id },
      select: { id: true, imageUrl: true },
    });
    if (!dest) {
      return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
    }

    await prisma.destination.delete({ where: { id: dest.id } });

    const publicId = tryExtractPublicIdFromUrl(dest.imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (e) {
        console.warn("No se pudo eliminar en Cloudinary:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[destinations:DELETE] error:", e);
    return NextResponse.json(
      { error: "No se pudo eliminar", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}
