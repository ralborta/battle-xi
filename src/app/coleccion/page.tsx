import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { COLLECTION_MAX } from "@/lib/futbol5";
import { prisma } from "@/lib/db";
import type { Rarity } from "@/lib/rarity";
import type { Position } from "@/components/PlayerCard";
import type { F5Slot } from "@/lib/futbol5";
import { redirect } from "next/navigation";
import { ColeccionClient } from "./ColeccionClient";

export default async function ColeccionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cards = await prisma.card.findMany({
    where: { userId: user.id },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    include: { squadSlots: { select: { slotKey: true } } },
  });

  const subtitle =
    cards.length === 0
      ? "Todavía no fichaste ninguna carta"
      : `${cards.length}/${COLLECTION_MAX} fichas · tocá una para verla`;

  return (
    <>
      <PageShell title="Mi Colección" subtitle={subtitle}>
        <ColeccionClient
          initialCards={cards.map((card) => ({
            id: card.id,
            playerName: card.playerName,
            position: card.position as Position,
            rarity: card.rarity as Rarity,
            rating: card.rating,
            countryFlag: card.countryFlag,
            imageUrl: card.imageUrl,
            level: card.level,
            xp: card.xp,
            vel: card.vel,
            tir: card.tir,
            pas: card.pas,
            reg: card.reg,
            def: card.def,
            fis: card.fis,
            ability: card.ability,
            inSquadSlot: (card.squadSlots[0]?.slotKey as F5Slot | undefined) ?? null,
          }))}
        />
      </PageShell>
      <BottomNav />
    </>
  );
}
