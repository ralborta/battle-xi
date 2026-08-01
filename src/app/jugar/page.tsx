import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { PlayerCard } from "@/components/PlayerCard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ENERGY_MAX, currentEnergy, userLevel } from "@/lib/game";
import { Gem, ScanLine, Swords, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function JugarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const captain = await prisma.card.findFirst({
    where: { userId: user.id },
    orderBy: [{ rating: "desc" }, { level: "desc" }],
  });

  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);

  return (
    <>
      <PageShell
        title={`Hola, ${user.nickname}`}
        subtitle={`Nivel ${userLevel(user.xp)} · ${user.trophies} trofeos`}
      >
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/5 p-3">
            <div className="flex items-center gap-2 text-[11px] font-display tracking-widest uppercase text-text-tertiary">
              <Gem className="w-3.5 h-3.5 text-cyan-300" />
              Gemas
            </div>
            <div
              className="mt-1 font-display text-3xl text-cyan-200"
              style={{ textShadow: "0 0 12px rgba(34,211,238,0.55)" }}
            >
              {user.gems}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-amber-700/5 p-3">
            <div className="flex items-center gap-2 text-[11px] font-display tracking-widest uppercase text-text-tertiary">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Energía
            </div>
            <div
              className="mt-1 font-display text-3xl text-amber-300"
              style={{ textShadow: "0 0 12px rgba(251,191,36,0.55)" }}
            >
              {energy}
              <span className="text-base text-amber-300/50">/{ENERGY_MAX}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-transparent p-5 mb-5">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-200 text-[11px] font-display tracking-widest uppercase">
              <ScanLine className="w-4 h-4" />
              Acción principal
            </div>
            <p className="mt-2 font-display text-2xl text-text-primary leading-tight">
              Escaneá tu próxima figurita
            </p>
            <p className="mt-1 text-sm text-text-tertiary">
              Tu figurita se transforma en una carta exclusiva.
            </p>
            <Link href="/escanear" className="block mt-4">
              <Button variant="cyan" size="lg" fullWidth icon={<ScanLine className="w-5 h-5" />}>
                Escanear ahora
              </Button>
            </Link>
          </div>
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Tu capitán
        </h2>
        {captain ? (
          <div className="flex justify-center mb-6">
            <PlayerCard
              name={captain.playerName}
              rating={captain.rating}
              position={captain.position}
              rarity={captain.rarity}
              countryFlag={captain.countryFlag}
              level={captain.level}
              imageUrl={captain.imageUrl ?? undefined}
              size="md"
              stats={{
                vel: captain.vel,
                tir: captain.tir,
                pas: captain.pas,
                reg: captain.reg,
                def: captain.def,
                fis: captain.fis,
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border-soft bg-white/5 p-6 text-center mb-6">
            <p className="font-display text-base text-text-primary">
              Todavía no tenés capitán
            </p>
            <p className="mt-1 text-sm text-text-tertiary font-body">
              La primera figurita que escanees se pone la cinta.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/batallas">
            <Button variant="violet" size="md" fullWidth icon={<Swords className="w-4 h-4" />}>
              Batalla
            </Button>
          </Link>
          <Link href="/torneos">
            <Button variant="gold" size="md" fullWidth icon={<Trophy className="w-4 h-4" />}>
              Torneo
            </Button>
          </Link>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
