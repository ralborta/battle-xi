import "server-only";

import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { COLLECTION_MAX, sellPriceForRarity } from "@/lib/futbol5";

export class CollectionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getCollectionCount(userId: string): Promise<number> {
  return prisma.card.count({ where: { userId } });
}

export async function assertCollectionRoom(userId: string, incoming: number) {
  const count = await getCollectionCount(userId);
  if (count + incoming > COLLECTION_MAX) {
    throw new CollectionError(
      `Tu club está lleno (${count}/${COLLECTION_MAX}). Vendé fichas antes de abrir otro sobre.`,
      409,
    );
  }
}

export async function sellCard(user: User, cardId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: user.id },
    include: { squadSlots: { select: { id: true, slotKey: true } } },
  });

  if (!card) throw new CollectionError("Esa ficha no está en tu colección", 404);

  if (card.squadSlots.length > 0) {
    throw new CollectionError(
      "Sacá la ficha del equipo antes de venderla",
      409,
    );
  }

  const total = await prisma.card.count({ where: { userId: user.id } });
  if (total <= 5) {
    throw new CollectionError(
      "Tenés que conservar al menos 5 fichas para armar el equipo",
      409,
    );
  }

  const gems = sellPriceForRarity(card.rarity);

  const [, updatedUser] = await prisma.$transaction([
    prisma.card.delete({ where: { id: card.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: { gems: { increment: gems } },
    }),
  ]);

  return {
    soldId: card.id,
    gemsEarned: gems,
    gems: updatedUser.gems,
    playerName: card.playerName,
  };
}
