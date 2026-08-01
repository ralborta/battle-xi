import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { grantStarterCards, ensureCatalogSeeded } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getOrCreateFutbol5Squad } from "@/lib/squad-service";
import { redirect } from "next/navigation";
import { EquipoClient } from "./EquipoClient";

export default async function EquipoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureCatalogSeeded();
  // Usuarios viejos: les regalamos el plantel la primera vez que entran.
  await grantStarterCards(user.id);

  const [squad, cards, activeMatch] = await Promise.all([
    getOrCreateFutbol5Squad(user.id),
    prisma.card.findMany({
      where: { userId: user.id },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    }),
    prisma.teamMatch.findFirst({
      where: { userId: user.id, status: "active" },
      select: { id: true },
    }),
  ]);

  return (
    <>
      <PageShell
        title="Mi equipo"
        subtitle={
          activeMatch
            ? "Tenés un partido sin terminar"
            : "Fútbol 5 · Armá y salí a sumar puntos"
        }
      >
        {activeMatch && (
          <a
            href={`/equipo/partido/${activeMatch.id}`}
            className="block mb-4 rounded-2xl border border-cyan-400/50 bg-cyan-400/10 p-4 text-center"
          >
            <p className="font-display text-lg text-cyan-100">Volver al partido</p>
          </a>
        )}
        <EquipoClient
          initialSquad={{
            id: squad.id,
            style: squad.style,
            captainSlot: squad.captainSlot,
            slots: squad.slots.map((s) => ({
              slotKey: s.slotKey,
              cardId: s.cardId,
              card: s.card
                ? {
                    id: s.card.id,
                    playerName: s.card.playerName,
                    position: s.card.position,
                    rarity: s.card.rarity,
                    rating: s.card.rating,
                    countryFlag: s.card.countryFlag,
                    imageUrl: s.card.imageUrl,
                    level: s.card.level,
                    vel: s.card.vel,
                    tir: s.card.tir,
                    pas: s.card.pas,
                    reg: s.card.reg,
                    def: s.card.def,
                    fis: s.card.fis,
                    ability: s.card.ability,
                  }
                : null,
            })),
          }}
          cards={cards.map((c) => ({
            id: c.id,
            playerName: c.playerName,
            position: c.position,
            rarity: c.rarity,
            rating: c.rating,
            countryFlag: c.countryFlag,
            imageUrl: c.imageUrl,
            level: c.level,
            vel: c.vel,
            tir: c.tir,
            pas: c.pas,
            reg: c.reg,
            def: c.def,
            fis: c.fis,
            ability: c.ability,
          }))}
        />
      </PageShell>
      <BottomNav />
    </>
  );
}
