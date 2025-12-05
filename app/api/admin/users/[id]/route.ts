import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

type JsonBody = {
  status?: "ACTIVE" | "INACTIVE";
  commissionRate?: number | string | null;
};

const FILE_FIELDS = [
  "purchaseOrder",
  "flightTickets",
  "serviceVoucher",
  "medicalAssistanceCard",
  "travelTips",
] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";
  const data: Record<string, any> = {};

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as JsonBody;

    if (body.status && (body.status === "ACTIVE" || body.status === "INACTIVE")) {
      data.status = body.status;
    }

    if ("commissionRate" in body) {
      if (target.role === "SELLER") {
        const v = body.commissionRate;
        if (v === null || v === "") {
          data.commissionRate = null;
        } else {
          const num = typeof v === "string" ? Number(v) : v ?? 0; // ✅ default seguro
          if (Number.isNaN(num) || num < 0 || num > 100) {
            return NextResponse.json(
              { error: "commissionRate debe estar entre 0 y 100" },
              { status: 400 }
            );
          }
          data.commissionRate = Number(num.toFixed(2));
        }
      } else {
        data.commissionRate = null;
      }
    }
  } else if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();

    const statusRaw = form.get("status") as string | null;
    if (statusRaw === "ACTIVE" || statusRaw === "INACTIVE") {
      data.status = statusRaw;
    }

    const commissionRateRaw = form.get("commissionRate") as string | null;
    if (commissionRateRaw !== null && commissionRateRaw !== "") {
      if (target.role === "SELLER") {
        const num = Number(commissionRateRaw ?? 0); // ✅ evita "possibly undefined"
        if (Number.isNaN(num) || num < 0 || num > 100) {
          return NextResponse.json(
            { error: "commissionRate debe estar entre 0 y 100" },
            { status: 400 }
          );
        }
        data.commissionRate = Number(num.toFixed(2));
      } else {
        data.commissionRate = null;
      }
    }

    for (const key of FILE_FIELDS) {
      const file = form.get(key) as File | null;
      if (file && file.size > 0) {
        try {
          const result: any = await uploadToCloudinary(file);
          data[key] = result.secure_url;
        } catch {
          return NextResponse.json({ error: `Error subiendo ${key}` }, { status: 500 });
        }
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        role: true,
        status: true,
        commissionRate: true,
        purchaseOrder: true,
        flightTickets: true,
        serviceVoucher: true,
        medicalAssistanceCard: true,
        travelTips: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();

  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario" },
      { status: 400 }
    );
  }
}

