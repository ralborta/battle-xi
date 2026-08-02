import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ENERGY_MAX, ENERGY_REFILL_COST, currentEnergy } from "@/lib/game";
import { Gem, ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AbrirSobre } from "./AbrirSobre";
import { RecargarEnergia } from "./RecargarEnergia";

export default async function TiendaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);
  const collectionCount = await prisma.card.count({ where: { userId: user.id } });

  return (
    <>
      <PageShell title="Tienda" subtitle="Gastá gemas, no plata real">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/10 p-4 mb-6">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Tus gemas
              </p>
              <p
                className="mt-1 font-display text-4xl text-cyan-200 leading-none"
                style={{ textShadow: "0 0 14px rgba(34,211,238,0.6)" }}
              >
                {user.gems}
              </p>
              <p className="mt-2 text-[11px] text-text-tertiary font-body">
                Ganás gemas jugando partidos y duelos.
              </p>
            </div>
            <Gem
              className="w-14 h-14 text-cyan-300"
              style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.7))" }}
            />
          </div>
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Sobres
        </h2>
        <AbrirSobre gems={user.gems} collectionCount={collectionCount} />

        <h2 className="font-display text-lg tracking-wide text-text-secondary mt-7 mb-3">
          Mejoras
        </h2>
        <RecargarEnergia
          gems={user.gems}
          energy={energy}
          max={ENERGY_MAX}
          cost={ENERGY_REFILL_COST}
        />

        <Link
          href="/escanear"
          className="mt-6 flex items-center justify-center gap-2 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-200 text-sm font-display tracking-wider uppercase"
        >
          <ScanLine className="w-4 h-4" />
          También podés escanear figuritas
        </Link>
      </PageShell>
      <BottomNav />
    </>
  );
}
