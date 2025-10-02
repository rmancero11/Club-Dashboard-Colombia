// /app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0]
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    country: user.country,
    budget: user.budget,
    preference: user.preference,
    destino: user.destino,
    createdAt: user.createdAt,
    avatar: user.avatar,
  }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}
