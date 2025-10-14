import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const body = await req.json();
    const { whatsappNumber, currentlyLink } = body;

    const updated = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        whatsappNumber,
        currentlyLink,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
