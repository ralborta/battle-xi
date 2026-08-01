import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ColeccionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cards = await prisma.card.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const subtitle =
    cards.length === 0
      ? "Todavía no fichaste ninguna carta"
      : `${cards.length} ${cards.length === 1 ? "carta" : "cartas"} en tu club`;

  return (
    <>
      <PageShell title="Mi Colección" subtitle={subtitle}>
        <div className="mb-6">
          <Link href="/escanear" className="block">
            <Button
              variant="cyan"
              size="lg"
              fullWidth
              icon={<ScanLine className="w-5 h-5" />}
            >
              Escanear figurita
            </Button>
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-3xl border border-border-soft bg-white/5 px-6 py-10 text-center">
            <ScanLine className="mx-auto h-12 w-12 text-cyan-300/70" />
            <p className="mt-4 font-display text-lg text-text-primary">
              Tu álbum está vacío
            </p>
            <p className="mt-2 text-sm text-text-tertiary font-body">
              Escaneá tu primera figurita y la convertimos en una carta con stats
              propios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="flex justify-center">
                <PlayerCard
                  name={card.playerName}
                  rating={card.rating}
                  position={card.position}
                  rarity={card.rarity}
                  countryFlag={card.countryFlag}
                  level={card.level}
                  imageUrl={card.imageUrl ?? undefined}
                  size="sm"
                  stats={{
                    vel: card.vel,
                    tir: card.tir,
                    pas: card.pas,
                    reg: card.reg,
                    def: card.def,
                    fis: card.fis,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}
