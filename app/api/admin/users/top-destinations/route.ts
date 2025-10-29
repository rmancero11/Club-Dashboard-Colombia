import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function parseRange(searchParams: URLSearchParams) {
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  if (!fromStr) throw new Error('Missing "from" query param (ISO date)');
  const from = new Date(fromStr);
  if (Number.isNaN(from.getTime())) throw new Error('Invalid "from" date');

  const to = toStr ? new Date(toStr) : new Date();
  if (Number.isNaN(to.getTime())) throw new Error('Invalid "to" date');

  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? 7)));
  return { from, to, limit };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { from, to, limit } = parseRange(searchParams);

    // Traer todos los usuarios con destinos dentro del rango
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        destino: { isEmpty: false },
      },
      select: { destino: true },
    });

    // Contar frecuencia de cada destino
    const freq: Record<string, number> = {};
    users.forEach(u => u.destino.forEach(d => {
      if (!d) return;
      freq[d] = (freq[d] || 0) + 1;
    }));

    // Ordenar y limitar
    const data = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([destino, count]) => ({ destino, count }));

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
