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

  return { from, to };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { from, to } = parseRange(searchParams);

    const [totalUsers, newUsers, countriesGroup, topDestGroup] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.user.groupBy({
        by: ['country'],
        where: {
          createdAt: { gte: from, lte: to },
          country: { not: null },
        },
      }),
      prisma.user.groupBy({
        by: ['destino'],
        where: {
          createdAt: { gte: from, lte: to },
          destino: { not: null },
        },
        _count: { destino: true },
        orderBy: { _count: { destino: 'desc' } },
        take: 1,
      }),
    ]);

    const uniqueCountries = countriesGroup
      .map((g) => g.country)
      .filter((c): c is string => !!c).length;

    const topDestination = topDestGroup.length ? topDestGroup[0].destino : null;

    return NextResponse.json({
      totalUsers,
      newUsers,
      uniqueCountries,
      topDestination,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
