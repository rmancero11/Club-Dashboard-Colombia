import 'dotenv/config';

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function argFlag(name, fallback = false) {
  const has = process.argv.some(a => a === `--${name}`);
  return has ? true : fallback;
}

const MODE_CLEAN = argFlag("clean", false);
const MODE_LOAD = argFlag("load", !MODE_CLEAN);

// Por seguridad en prod: solo avisa (no bloquea). Para silenciar, usa SEED_ALLOW_PROD=true
const isProd = process.env.NODE_ENV === "production";
if (isProd && !process.env.SEED_ALLOW_PROD) {
  console.warn(
    "[seed] Ejecutando en NODE_ENV=production. Si es intencional, exporta SEED_ALLOW_PROD=true para silenciar este aviso."
  );
}

async function clean() {
  console.log("[seed] Limpieza iniciada...");
  // Orden por dependencias (deleteMany no dispara cascadas; por eso vamos de hijos a padres)
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({}),
    prisma.activityLog.deleteMany({}),
    prisma.task.deleteMany({}),
    prisma.reservation.deleteMany({}),
    prisma.client.deleteMany({}),
    prisma.destination.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
  console.log("[seed] Limpieza completada.");
}

async function upsertUser({ email, password, role, name, ...rest }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, ...rest },
    create: { email, password: passwordHash, role, name, ...rest },
  });
}

// upsert para Destination con índice único compuesto (name,country,city):
async function upsertDestination({ name, country, city = null, ...data }) {
  const existing = await prisma.destination.findFirst({
    where: { name, country, city },
  });
  if (existing) {
    return prisma.destination.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.destination.create({
    data: { name, country, city, ...data },
  });
}

async function load() {
  console.log("[seed] Carga de datos…");

  // ====== Usuarios base ======
  const admin = await upsertUser({
    email: "admin@clubviajeros.dev",
    password: "admin123", // cámbialo en prod
    role: "ADMIN",
    name: "Admin",
    status: "ACTIVE",
    verified: true,
  });

  const seller = await upsertUser({
    email: "seller@clubviajeros.dev",
    password: "seller123",
    role: "SELLER",
    name: "Agente Demo",
    status: "ACTIVE",
    verified: true,
    commissionRate: "7.50",
    whatsappNumber: "+57 3000000000",
  });

  const traveler = await upsertUser({
    email: "viajero@clubviajeros.dev",
    password: "user123",
    role: "USER",
    name: "Viajero Demo",
    status: "ACTIVE",
    verified: true,
    country: "CO",
    preference: "Playa y ciudad",
  });

  // ====== Destinos ======
  const cartagena = await upsertDestination({
    name: "Cartagena",
    country: "Colombia",
    city: "Cartagena",
    category: "playa",
    isActive: true,
    popularityScore: 95,
    imageUrl: "https://via.placeholder.com/800x600?text=Cartagena",
    price: "1200.00",
    discountPrice: "999.00",
  });

  const sanAndres = await upsertDestination({
    name: "San Andrés",
    country: "Colombia",
    city: "San Andrés",
    category: "playa",
    isActive: true,
    popularityScore: 88,
    imageUrl: "https://via.placeholder.com/800x600?text=San+Andres",
    price: "1100.00",
  });

  // ====== Client (perfil vinculado al USER) ======
  // El modelo exige: sellerId y userId (único)
  const client = await prisma.client.upsert({
    where: { userId: traveler.id },
    update: {
      name: traveler.name ?? "Viajero Demo",
      email: traveler.email,
      sellerId: seller.id,
      country: traveler.country ?? "CO",
    },
    create: {
      name: traveler.name ?? "Viajero Demo",
      email: traveler.email,
      sellerId: seller.id,
      userId: traveler.id,
      country: traveler.country ?? "CO",
      tags: ["demo", "lead"],
    },
    include: { user: true, seller: true },
  });

  // ====== Reserva ======
  // code es único, usamos un code determinista o por fecha
  const code = "RES-2025-000001";
  const reservation = await prisma.reservation.upsert({
    where: { code },
    update: {
      sellerId: seller.id,
      clientId: client.id,
      destinationId: cartagena.id,
      status: "LEAD",
      totalAmount: "1500.00",
    },
    create: {
      code,
      sellerId: seller.id,
      clientId: client.id,
      destinationId: cartagena.id,
      startDate: new Date("2026-01-15T00:00:00Z"),
      endDate: new Date("2026-01-20T00:00:00Z"),
      paxAdults: 2,
      paxChildren: 0,
      currency: "USD",
      totalAmount: "1500.00",
      status: "LEAD",
      notes: "Reserva demo creada por seed.",
    },
  });

  // ====== Tarea ======
  const task = await prisma.task.create({
    data: {
      sellerId: seller.id,
      reservationId: reservation.id,
      title: "Llamar al cliente para confirmar fechas",
      description: "Confirmar si prefiere upgrade de hotel y seguro médico.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "OPEN",
      priority: "MEDIUM",
    },
  });

  // ====== Activity Logs ======
  await prisma.activityLog.createMany({
    data: [
      {
        action: "CREATE_CLIENT",
        message: `Cliente creado: ${client.name}`,
        userId: seller.id,
        clientId: client.id,
        metadata: { source: "seed" },
      },
      {
        action: "CREATE_RESERVATION",
        message: `Reserva ${reservation.code} creada para ${client.name} hacia ${cartagena.name}`,
        userId: seller.id,
        clientId: client.id,
        reservationId: reservation.id,
        metadata: { source: "seed" },
      },
      {
        action: "QUOTE_SENT",
        message: `Cotización enviada a ${client.email}`,
        userId: seller.id,
        clientId: client.id,
        reservationId: reservation.id,
        metadata: { channel: "email", source: "seed" },
      },
    ],
  });

  // ====== Extra: segunda reserva rápida ======
  await prisma.reservation.upsert({
    where: { code: "RES-2025-000002" },
    update: {},
    create: {
      code: "RES-2025-000002",
      sellerId: seller.id,
      clientId: client.id,
      destinationId: sanAndres.id,
      startDate: new Date("2026-02-10T00:00:00Z"),
      endDate: new Date("2026-02-15T00:00:00Z"),
      paxAdults: 2,
      paxChildren: 1,
      currency: "USD",
      totalAmount: "1750.00",
      status: "QUOTED",
      notes: "Segunda reserva demo.",
    },
  });

  console.log("[seed] Datos cargados correctamente.");
}

async function main() {
  if (MODE_CLEAN) {
    await clean();
  }
  if (MODE_LOAD) {
    await load();
  }
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
