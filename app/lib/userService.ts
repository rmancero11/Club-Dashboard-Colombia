import prisma from "@/app/lib/prisma";

export interface AutoAssignClientOptions {
  userId: string;
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
    let seller = await tx.user.findFirst({
      where: { role: "SELLER", status: "ACTIVE" },
      orderBy: { sellerClients: { _count: "asc" } },
      select: { id: true },
    });

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

    const existingClient = await tx.client.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true, userId: true, tags: true },
    });

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
      const tagsToPush =
        newTags.filter(
          (t) => !(existingClient.tags ?? []).includes(t)
        );

      const updated = await tx.client.update({
        where: { id: existingClient.id },
        data: {
          userId: existingClient.userId ?? userId, 
          phone: phone ?? undefined,
          country: country ?? undefined,
          ...(tagsToPush.length ? { tags: { push: tagsToPush } } : {}),
          ...(notes ? { notes } : {}),
          sellerId: seller.id,
        },
        select: { id: true },
      });
      clientId = updated.id;
    } else {
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
