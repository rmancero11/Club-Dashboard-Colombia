// app/api/register-admin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos requeridos son obligatorios' },
        { status: 200 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'El correo ya está registrado' },
        { status: 200 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN', // 👈 fuerza rol de administrador
      },
    })

    return NextResponse.json(
      { success: true, message: 'Administrador creado correctamente' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en register-admin:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
