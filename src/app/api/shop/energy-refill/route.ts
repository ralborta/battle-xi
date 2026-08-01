import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ENERGY_MAX, ENERGY_REFILL_COST, currentEnergy } from "@/lib/game";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Entrá a tu cuenta para comprar" }, { status: 401 });
  }

  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);
  if (energy >= ENERGY_MAX) {
    return NextResponse.json({ error: "Ya tenés el tanque lleno" }, { status: 409 });
  }

  // El descuento va condicionado en el propio WHERE: si el chico toca el botón
  // dos veces seguidas, la segunda no encuentra fila y no gasta gemas de más.
  const { count } = await prisma.user.updateMany({
    where: { id: user.id, gems: { gte: ENERGY_REFILL_COST } },
    data: {
      gems: { decrement: ENERGY_REFILL_COST },
      energy: ENERGY_MAX,
      energyUpdatedAt: new Date(),
    },
  });

  if (count === 0) {
    return NextResponse.json(
      { error: `Te faltan gemas: la recarga cuesta ${ENERGY_REFILL_COST}` },
      { status: 409 },
    );
  }

  return NextResponse.json({
    gems: user.gems - ENERGY_REFILL_COST,
    energy: ENERGY_MAX,
  });
}
