import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Destino } from "@/app/types/destino";

// POST: crear destino
export async function POST(req: Request) {
  try {
    const body: Destino = await req.json();

    const nuevoDestino = await prisma.destino.create({
      data: {
        nombre: body.nombre,
        precio: body.precio,
        descripcion: body.descripcion,
        incluidos: body.incluidos,
        imagen: body.imagen,
      },
    });

    return NextResponse.json(nuevoDestino, { status: 201 });
  } catch (error) {
    console.error("Error creando destino:", error);
    return NextResponse.json({ error: "Error al crear destino" }, { status: 500 });
  }
}

// GET: traer todos los destinos
export async function GET() {
  try {
    const destinos = await prisma.destino.findMany();
    return NextResponse.json(destinos, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo destinos:", error);
    return NextResponse.json({ error: "Error al obtener destinos" }, { status: 500 });
  }
}
