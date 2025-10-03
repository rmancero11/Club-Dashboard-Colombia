// app/api/admin/users/list/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function parseQuery(searchParams: URLSearchParams) {
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  if (!fromStr) throw new Error('Missing "from" query param (ISO date)');
  const from = new Date(fromStr);
  if (Number.isNaN(from.getTime())) throw new Error('Invalid "from" date');

  const to = toStr ? new Date(toStr) : new Date();
  if (Number.isNaN(to.getTime())) throw new Error('Invalid "to" date');

  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? 10)));
  const cursor = searchParams.get('cursor') ?? undefined; // para paginación cursor-based

  return { from, to, limit, cursor };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { from, to, limit, cursor } = parseQuery(searchParams);

    const where = { createdAt: { gte: from, lte: to } };

    const rows = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // pedir uno extra para saber si hay next
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        budget: true,
        preference: true,
        destino: true,
        createdAt: true,
      },
    });

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const next = rows.pop()!; // quita el extra
      nextCursor = next.id;
    }

    const data = rows.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ data, nextCursor });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
