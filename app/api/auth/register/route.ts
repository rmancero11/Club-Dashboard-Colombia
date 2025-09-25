// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,      
      email,
      country,
      whatsapp,
      presupuesto,
      preferencia,
      destino,
      password
    } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'El correo ya está registrado' }, { status: 400 });
    }

    const [firstName, lastName] = (name || '').split(/\s+/, 2);

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: whatsapp,
        country,
        budget: presupuesto,
        preference: preferencia,
        password: hashed
      }
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: 'Error al registrar' }, { status: 500 });
  }
}
