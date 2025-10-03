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

    const grouped = await prisma.user.groupBy({
      by: ['destino'],
      where: {
        createdAt: { gte: from, lte: to },
        destino: { not: null },
      },
      _count: { destino: true },
      orderBy: { _count: { destino: 'desc' } },
      take: limit,
    });

    const data = grouped.map((g) => ({
      destino: g.destino ?? '—',
      count: (g as any)._count?.destino ?? 0,
    }));

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
