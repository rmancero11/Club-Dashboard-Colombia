import prisma from "@/app/lib/prisma";

export interface AutoAssignClientOptions {
  userId: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  destino?: string | null;
  preferencia?: string | null;
  sellerDefaultId?: string | null;
}

export async function assignSellerAutomatically(options: AutoAssignClientOptions) {
  const { userId, businessId, name, email, phone, country, destino, preferencia, sellerDefaultId } = options;

  return prisma.$transaction(async (tx) => {
    // Buscar un seller activo con menos clientes
    let seller = await tx.user.findFirst({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      orderBy: { sellerClients: { _count: "asc" } },
      select: { id: true },
    });

    // Fallback a seller default
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
      return null; // No se crea client
    }

    // Buscar si ya existe el cliente
    const existingClient = await tx.client.findFirst({
      where: {
        businessId,
        OR: [{ email }, phone ? { phone } : { id: "" }],
      },
      select: { id: true, userId: true },
    });

    // Preparar tags y notas
    const tags: string[] = [];
    if (preferencia) tags.push(`pref:${preferencia}`);
    if (destino) tags.push(`dest:${destino}`);

    const notes = [
      destino ? `Destino de interés: ${destino}` : null,
      preferencia ? `Preferencias: ${preferencia}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    let clientId: string;

    if (existingClient) {
      const updated = await tx.client.update({
        where: { id: existingClient.id },
        data: {
          userId: existingClient.userId ?? userId,
          phone: phone ?? undefined,
          country: country ?? undefined,
          tags: tags.length ? { push: tags } : undefined,
          notes: notes ? { set: notes } : undefined,
          sellerId: seller.id,
        },
        select: { id: true },
      });
      clientId = updated.id;
    } else {
      const created = await tx.client.create({
        data: {
          businessId,
          sellerId: seller.id,
          userId,
          name: name ?? email,
          email,
          phone: phone ?? null,
          country: country ?? null,
          tags,
          notes: notes || null,
        },
        select: { id: true },
      });
      clientId = created.id;
    }

    // Crear ActivityLog
    await tx.activityLog.create({
      data: {
        businessId,
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
