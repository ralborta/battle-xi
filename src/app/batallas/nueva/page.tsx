import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ENERGY_PER_BATTLE, currentEnergy } from "@/lib/game";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ElegirCarta } from "./ElegirCarta";

export default async function NuevaBatallaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const active = await prisma.battle.findFirst({
    where: { userId: user.id, status: "active" },
    select: { id: true },
  });
  if (active) redirect(`/batallas/${active.id}`);

  const cards = await prisma.card.findMany({
    where: { userId: user.id },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);

  if (cards.length === 0) {
    return (
      <>
        <PageShell title="Batalla rápida" subtitle="Necesitás al menos una carta" back="/batallas">
          <div className="rounded-3xl border border-border-soft bg-white/5 px-6 py-10 text-center">
            <ScanLine className="mx-auto h-12 w-12 text-cyan-300/70" />
            <p className="mt-4 font-display text-lg text-text-primary">
              Todavía no tenés con qué pelear
            </p>
            <p className="mt-2 text-sm text-text-tertiary font-body">
              Escaneá una figurita y volvé a la cancha con tu primera carta.
            </p>
            <Link href="/escanear" className="block mt-6">
              <Button variant="cyan" size="lg" fullWidth icon={<ScanLine className="w-5 h-5" />}>
                Escanear figurita
              </Button>
            </Link>
          </div>
        </PageShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <PageShell
        title="Elegí tu carta"
        subtitle={`Energía ${energy}/20 · el duelo cuesta ${ENERGY_PER_BATTLE}`}
        back="/batallas"
      >
        <ElegirCarta
          hasEnergy={energy >= ENERGY_PER_BATTLE}
          cards={cards.map((card) => ({
            id: card.id,
            name: card.playerName,
            rating: card.rating,
            position: card.position,
            rarity: card.rarity,
            flag: card.countryFlag,
            level: card.level,
            imageUrl: card.imageUrl,
            stats: {
              vel: card.vel,
              tir: card.tir,
              pas: card.pas,
              reg: card.reg,
              def: card.def,
              fis: card.fis,
            },
          }))}
        />
      </PageShell>
      <BottomNav />
    </>
  );
}
