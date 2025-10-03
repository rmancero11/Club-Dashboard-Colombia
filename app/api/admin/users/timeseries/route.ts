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

  // (Opcional) interval future-proof
  const interval = (searchParams.get('interval') || 'day').toLowerCase();

  return { from, to, interval };
}

function keyDay(d: Date) {
  // YYYY-MM-DD en UTC para consistencia
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { from, to } = parseRange(searchParams);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const counts = new Map<string, number>();
    users.forEach(({ createdAt }) => {
      const k = keyDay(createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });

    // Rellenar huecos de días sin registros
    const out: { date: string; count: number }[] = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

    while (cursor <= end) {
      const k = keyDay(cursor);
      out.push({ date: k, count: counts.get(k) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
