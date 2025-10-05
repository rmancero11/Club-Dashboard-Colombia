import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (typeof body.Name === "string") data.Name = body.Name.trim();
  if (body.country === null || typeof body.country === "string") data.country = body.country ? body.country.trim() : null;
  if (body.Plan === null || typeof body.Plan === "string") data.Plan = body.Plan ? body.Plan.trim() : null;
  if (body.Template === null || typeof body.Template === "string") data.Template = body.Template ? body.Template.trim() : null;
  if (body.BusinessProgram === null || typeof body.BusinessProgram === "string") data.BusinessProgram = body.BusinessProgram ? body.BusinessProgram.trim() : null;
  if (body.PricePlan === null || typeof body.PricePlan === "number") data.PricePlan = body.PricePlan ?? null;
  if (body.IconoWhite === null || typeof body.IconoWhite === "string") data.IconoWhite = body.IconoWhite ? body.IconoWhite.trim() : null;
  if (body.Cover === null || typeof body.Cover === "string") data.Cover = body.Cover ? body.Cover.trim() : null;
  if (body.SocialMedia === null || typeof body.SocialMedia === "object") data.SocialMedia = body.SocialMedia;

  if (!data.Name) return NextResponse.json({ error: "Name es requerido" }, { status: 400 });

  try {
    const updated = await prisma.business.update({
      where: { id: auth.businessId },
      data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
