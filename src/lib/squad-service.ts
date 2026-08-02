import "server-only";

import type { Card, Squad, SquadSlot, TeamStyle } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  F5_SLOTS,
  type F5Slot,
  slotPosition,
} from "@/lib/futbol5";

export type SquadWithSlots = Squad & {
  slots: (SquadSlot & { card: Card | null })[];
};

export async function getOrCreateFutbol5Squad(userId: string): Promise<SquadWithSlots> {
  const existing = await prisma.squad.findUnique({
    where: { userId_mode: { userId, mode: "futbol5" } },
    include: { slots: { include: { card: true } } },
  });
  if (existing) return existing;

  return prisma.squad.create({
    data: {
      userId,
      mode: "futbol5",
      style: "equilibrio",
      slots: {
        create: F5_SLOTS.map((slotKey) => ({ slotKey })),
      },
    },
    include: { slots: { include: { card: true } } },
  });
}

export async function updateSquadLineup(
  userId: string,
  input: {
    slots: Partial<Record<F5Slot, string | null>>;
    style?: TeamStyle;
    captainSlot?: F5Slot | null;
  },
): Promise<SquadWithSlots> {
  const squad = await getOrCreateFutbol5Squad(userId);
  const owned = await prisma.card.findMany({
    where: { userId },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((c) => c.id));

  const used = new Set<string>();
  const incomingIds = Object.values(input.slots).filter(
    (id): id is string => typeof id === "string",
  );

  // Si una ficha entra a un puesto, la sacamos de cualquier otro.
  if (incomingIds.length > 0) {
    await prisma.squadSlot.updateMany({
      where: {
        squadId: squad.id,
        cardId: { in: incomingIds },
        NOT: { slotKey: { in: Object.keys(input.slots) } },
      },
      data: { cardId: null },
    });
  }

  for (const slotKey of F5_SLOTS) {
    if (!(slotKey in input.slots)) continue;
    const cardId = input.slots[slotKey] ?? null;

    if (cardId) {
      if (!ownedIds.has(cardId)) {
        throw Object.assign(new Error("Esa carta no es tuya"), { status: 403 });
      }
      if (used.has(cardId)) {
        throw Object.assign(new Error("La misma carta no puede ir en dos puestos"), { status: 409 });
      }
      used.add(cardId);
    }

    await prisma.squadSlot.update({
      where: { squadId_slotKey: { squadId: squad.id, slotKey } },
      data: { cardId },
    });
  }

  return prisma.squad.update({
    where: { id: squad.id },
    data: {
      style: input.style ?? squad.style,
      captainSlot:
        input.captainSlot === undefined ? squad.captainSlot : input.captainSlot,
    },
    include: { slots: { include: { card: true } } },
  });
}

/** Arma un XI rápido: mejor carta disponible por puesto. */
export async function autoFillFutbol5(userId: string): Promise<SquadWithSlots> {
  const squad = await getOrCreateFutbol5Squad(userId);
  const cards = await prisma.card.findMany({
    where: { userId },
    orderBy: [{ rating: "desc" }, { level: "desc" }],
  });

  const used = new Set<string>();
  const assignment: Partial<Record<F5Slot, string | null>> = {};

  for (const slot of F5_SLOTS) {
    const needed = slotPosition(slot);
    const best =
      cards.find((c) => !used.has(c.id) && c.position === needed) ??
      cards.find((c) => {
        if (used.has(c.id)) return false;
        // compatibles simples
        if (needed === "DEL" && c.position === "EXT") return true;
        if (needed === "MC" && (c.position === "DC" || c.position === "EXT")) return true;
        if (needed === "DEF" && c.position === "MC") return true;
        return false;
      }) ??
      null;

    if (best) {
      used.add(best.id);
      assignment[slot] = best.id;
    } else {
      assignment[slot] = null;
    }
  }

  return updateSquadLineup(userId, {
    slots: assignment,
    captainSlot: assignment.DEL ? "DEL" : assignment.MC1 ? "MC1" : "POR",
  });
}
