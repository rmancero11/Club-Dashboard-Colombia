import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // ✅ Seguridad: solo ADMIN
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = fromStr ? new Date(fromStr) : new Date("2000-01-01");
    const to = toStr ? new Date(toStr) : new Date();

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Fechas inválidas" },
        { status: 400 }
      );
    }

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 10;
    const skip = (page - 1) * limit;

    // ✅ WHERE correctamente tipado
    const where: Prisma.UserWhereInput = {
      createdAt: { gte: from, lte: to },
      ...(q && {
        OR: [
          {
            email: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            name: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      totalPages,
      page,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al listar usuarios" },
      { status: 500 }
    );
  }
}
