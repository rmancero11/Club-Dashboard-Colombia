/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const BUSINESS_SLUG = 'clubdeviajeros';
const PASSWORD = 'password123'; // demo

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function resCode(n) {
  const y = new Date().getFullYear();
  return `RES-${y}-${String(n).padStart(6, '0')}`;
}

async function main() {
  console.log('🌱 Seeding…');

  // 1) Business
  const business = await prisma.business.upsert({
    where: { slug: BUSINESS_SLUG },
    update: {},
    create: {
      Name: 'Club de Viajeros Solteros',
      slug: BUSINESS_SLUG,
      country: 'CO',
      Plan: 'basic',
    },
  });
  const businessId = business.id;

  // 2) Branch opcional
  await prisma.branch.createMany({
    data: [
      {
        name: 'Sede Principal',
        address: 'Calle 123 #45-67',
        country: 'CO',
        businessId,
      },
    ],
    skipDuplicates: true,
  });

  // 3) Admin
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clubsolteros.com' },
    update: {},
    create: {
      email: 'admin@clubsolteros.com',
      name: 'Admin',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      businessId,
      timezone: 'America/Bogota',
    },
  });

  // 4) Sellers (3)
  const sellersData = [
    { name: 'Laura Torres', email: 'laura@clubsolteros.com', commissionRate: '10.00' },
    { name: 'Miguel Rojas', email: 'miguel@clubsolteros.com', commissionRate: '12.50' },
    { name: 'Ana Pérez', email: 'ana@clubsolteros.com', commissionRate: '8.00' },
  ];

  const sellers = [];
  for (const s of sellersData) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        password: passwordHash,
        role: 'SELLER',
        status: 'ACTIVE',
        businessId,
        timezone: 'America/Bogota',
        commissionRate: s.commissionRate, // decimal como string
      },
      select: { id: true, email: true, name: true },
    });
    sellers.push(u);
  }

  // 5) Users viajeros (8)
  const usersData = [
    { name: 'Sofía Gómez', email: 'sofia@example.com', country: 'CO', phone: '+57 300000001' },
    { name: 'Carlos Díaz', email: 'carlos@example.com', country: 'CO', phone: '+57 300000002' },
    { name: 'Mariana López', email: 'mariana@example.com', country: 'MX', phone: '+52 550000001' },
    { name: 'Julián Herrera', email: 'julian@example.com', country: 'AR', phone: '+54 110000001' },
    { name: 'Valentina Ruiz', email: 'valentina@example.com', country: 'ES', phone: '+34 600000001' },
    { name: 'Andrés Castro', email: 'andres@example.com', country: 'US', phone: '+1 7860000001' },
    { name: 'Daniela Torres', email: 'daniela@example.com', country: 'CO', phone: '+57 300000003' },
    { name: 'Felipe Mora', email: 'felipe@example.com', country: 'CO', phone: '+57 300000004' },
  ];

  const travelers = [];
  for (const u of usersData) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        country: u.country,
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        businessId,
        timezone: 'America/Bogota',
      },
      select: { id: true, email: true, name: true },
    });
    travelers.push(created);
  }

  // 6) Clients (8 vinculados a User + 4 sueltos), asignados a sellers
  const clients = [];
  for (let i = 0; i < travelers.length; i++) {
    const t = travelers[i];
    const seller = sellers[i % sellers.length];
    const cl = await prisma.client.create({
      data: {
        businessId,
        sellerId: seller.id,
        userId: t.id,
        name: t.name || t.email,
        email: t.email,
        phone: usersData[i].phone || null,
        country: usersData[i].country || null,
        city: null,
        tags: i % 2 === 0 ? ['newsletter', 'vip'] : ['newsletter'],
      },
    });
    clients.push(cl);
  }
  // 4 clientes adicionales sin user
  const extraClientsData = [
    { name: 'Hernán Páez', email: 'hernan@example.com', phone: '+57 300000010', country: 'CO' },
    { name: 'Lucía Méndez', email: 'lucia@example.com', phone: '+52 550000010', country: 'MX' },
    { name: 'Pablo Serra', email: 'pablo@example.com', phone: '+54 110000010', country: 'AR' },
    { name: 'Nuria Gil', email: 'nuria@example.com', phone: '+34 600000010', country: 'ES' },
  ];
  for (let i = 0; i < extraClientsData.length; i++) {
    const ec = extraClientsData[i];
    const seller = sellers[i % sellers.length];
    const cl = await prisma.client.create({
      data: {
        businessId,
        sellerId: seller.id,
        name: ec.name,
        email: ec.email,
        phone: ec.phone,
        country: ec.country,
        city: null,
        tags: ['lead'],
      },
    });
    clients.push(cl);
  }

  // 7) Destinations (8)
  const destinationsData = [
    { name: 'Cancún', country: 'MX', city: 'Cancún', category: 'Playa' },
    { name: 'Cartagena', country: 'CO', city: 'Cartagena', category: 'Playa' },
    { name: 'Medellín', country: 'CO', city: 'Medellín', category: 'Ciudad' },
    { name: 'Madrid', country: 'ES', city: 'Madrid', category: 'Ciudad' },
    { name: 'Barcelona', country: 'ES', city: 'Barcelona', category: 'Ciudad' },
    { name: 'París', country: 'FR', city: 'Paris', category: 'Ciudad' },
    { name: 'Nueva York', country: 'US', city: 'New York', category: 'Ciudad' },
    { name: 'Tulum', country: 'MX', city: 'Tulum', category: 'Playa' },
  ];

  const destinations = [];
  for (const d of destinationsData) {
    const dest = await prisma.destination.upsert({
      where: {
        businessId_name_country_city: {
          businessId,
          name: d.name,
          country: d.country,
          city: d.city || null,
        },
      },
      update: {},
      create: {
        businessId,
        name: d.name,
        country: d.country,
        city: d.city,
        category: d.category,
        isActive: true,
      },
    });
    destinations.push(dest);
  }

  // 8) Reservations (12) variadas
  const today = new Date();
  let seq = 1;

  function makeRes({ client, seller, dest, offsetStartDays, nights, status, amountUSD }) {
    const start = addDays(today, offsetStartDays);
    const end = addDays(start, nights);
    return prisma.reservation.create({
      data: {
        businessId,
        code: resCode(seq++),
        clientId: client.id,
        sellerId: seller.id,
        destinationId: dest.id,
        startDate: start,
        endDate: end,
        paxAdults: 2,
        paxChildren: 0,
        currency: 'USD',
        totalAmount: String(amountUSD.toFixed(2)),
        status,
        notes: `Reserva para ${client.name} en ${dest.name} (${ymd(start)} → ${ymd(end)})`,
      },
    });
  }

  const reservationsPayload = [
    // pasadas
    { offset: -90, nights: 5, status: 'COMPLETED', amount: 1200 },
    { offset: -60, nights: 7, status: 'COMPLETED', amount: 1850 },
    { offset: -45, nights: 3, status: 'CANCELED', amount: 0 },
    // recientes / actuales
    { offset: -5, nights: 4, status: 'CONFIRMED', amount: 980 },
    { offset: 0, nights: 3, status: 'CONFIRMED', amount: 640 },
    { offset: 2, nights: 6, status: 'PENDING', amount: 1600 },
    // futuras
    { offset: 15, nights: 5, status: 'PENDING', amount: 1300 },
    { offset: 25, nights: 7, status: 'DRAFT', amount: 0 },
    { offset: 40, nights: 8, status: 'CONFIRMED', amount: 2100 },
    { offset: 55, nights: 4, status: 'PENDING', amount: 900 },
    { offset: 70, nights: 10, status: 'DRAFT', amount: 0 },
    { offset: 90, nights: 6, status: 'PENDING', amount: 1500 },
  ];

  const reservations = [];
  for (let i = 0; i < reservationsPayload.length; i++) {
    const p = reservationsPayload[i];
    const client = clients[i % clients.length];
    const seller = sellers[i % sellers.length];
    const dest = destinations[i % destinations.length];
    const r = await makeRes({
      client,
      seller,
      dest,
      offsetStartDays: p.offset,
      nights: p.nights,
      status: p.status,
      amountUSD: p.amount,
    });
    reservations.push(r);
  }

  // 9) Tasks para Sellers
  const tasksData = [
    { title: 'Llamar a cliente', description: 'Confirmar fechas y documentos', dueIn: 2, priority: 'HIGH' },
    { title: 'Enviar cotización', description: 'Plan Cartagena 5 noches', dueIn: 1, priority: 'MEDIUM' },
    { title: 'Subir voucher', description: 'Adjuntar comprobantes al sistema', dueIn: 5, priority: 'LOW' },
  ];
  for (let i = 0; i < sellers.length; i++) {
    const s = sellers[i];
    for (let j = 0; j < tasksData.length; j++) {
      const t = tasksData[j];
      await prisma.task.create({
        data: {
          businessId,
          sellerId: s.id,
          title: t.title,
          description: t.description,
          dueDate: addDays(today, t.dueIn + i),
          status: j === 0 ? 'IN_PROGRESS' : 'OPEN',
          priority: t.priority,
          reservationId: reservations[(i + j) % reservations.length]?.id || null,
        },
      });
    }
  }

  // 10) ActivityLog de ejemplo
  await prisma.activityLog.createMany({
    data: [
      { businessId, action: 'LOGIN', userId: admin.id, message: 'Admin inició sesión' },
      { businessId, action: 'NOTE', message: 'Seed inicial ejecutado', metadata: { env: 'dev' } },
    ],
  });

  console.log('✅ Seed terminado.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
