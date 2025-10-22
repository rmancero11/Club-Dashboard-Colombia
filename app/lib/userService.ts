import prisma from "@/app/lib/prisma";

export interface AutoAssignClientOptions {
  userId: string;
  // businessId eliminado del schema; lo dejamos opcional por compatibilidad pero no se usa
  businessId?: string;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  destino?: string | null;
  preferencia?: string | null;
  sellerDefaultId?: string | null;
}

export async function assignSellerAutomatically(options: AutoAssignClientOptions) {
  const { userId, name, email, phone, country, destino, preferencia, sellerDefaultId } = options;

  return prisma.$transaction(async (tx) => {
    // 1) Buscar el SELLER activo con menos clientes
    let seller = await tx.user.findFirst({
      where: { role: "SELLER", status: "ACTIVE" },
      orderBy: { sellerClients: { _count: "asc" } },
      select: { id: true },
    });

    // Fallback a un seller por defecto (si es válido)
    if (!seller && sellerDefaultId) {
      const s = await tx.user.findUnique({
        where: { id: sellerDefaultId },
        select: { id: true, role: true, status: true },
      });
      if (s?.role === "SELLER" && s?.status === "ACTIVE") {
        seller = { id: s.id };
      }
    }

    if (!seller) {
      console.warn("[assignSellerAutomatically] No SELLER activo disponible.");
      return null;
    }

    // 2) Verificar si ya existe un Client por email o phone (sin businessId en el nuevo schema)
    const existingClient = await tx.client.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true, userId: true, tags: true },
    });

    // 3) Preparar tags y notas
    const newTags: string[] = [];
    if (preferencia) newTags.push(`pref:${preferencia}`);
    if (destino) newTags.push(`dest:${destino}`);

    const notes =
      [
        destino ? `Destino de interés: ${destino}` : null,
        preferencia ? `Preferencias: ${preferencia}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || null;

    let clientId: string;

    if (existingClient) {
      // Evitar duplicados de tags al hacer push
      const tagsToPush =
        newTags.filter(
          (t) => !(existingClient.tags ?? []).includes(t)
        );

      const updated = await tx.client.update({
        where: { id: existingClient.id },
        data: {
          userId: existingClient.userId ?? userId, // respeta el vínculo si ya existía
          phone: phone ?? undefined,
          country: country ?? undefined,
          // push solo si hay tags nuevas
          ...(tagsToPush.length ? { tags: { push: tagsToPush } } : {}),
          // actualizar notas si generamos algo nuevo
          ...(notes ? { notes } : {}),
          sellerId: seller.id,
        },
        select: { id: true },
      });
      clientId = updated.id;
    } else {
      // Crear un nuevo cliente (name es requerido en el schema)
      const created = await tx.client.create({
        data: {
          sellerId: seller.id,
          userId,
          name: name ?? email,
          email,
          phone: phone ?? null,
          country: country ?? null,
          tags: newTags,
          notes,
        },
        select: { id: true },
      });
      clientId = created.id;
    }

    // 4) Registrar actividad (sin businessId en el nuevo schema)
    await tx.activityLog.create({
      data: {
        action: "CREATE_CLIENT",
        message: `Cliente asignado automáticamente: ${name ?? email}`,
        metadata: { destino, preferencia },
        userId,
        clientId,
      },
    });

    return { sellerId: seller.id, clientId };
  });
}
