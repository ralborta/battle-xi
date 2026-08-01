import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { openPack } from "@/lib/catalog";
import { PACK_COST_GEMS, PACK_SIZE } from "@/lib/futbol5";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  try {
    const { cards, gems } = await openPack(user);
    return NextResponse.json({
      gems,
      cost: PACK_COST_GEMS,
      size: PACK_SIZE,
      cards: cards.map((c) => ({
        id: c.id,
        playerName: c.playerName,
        position: c.position,
        rarity: c.rarity,
        rating: c.rating,
        countryFlag: c.countryFlag,
        imageUrl: c.imageUrl,
        ability: c.ability,
      })),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
