import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { ENERGY_MAX, ENERGY_REFILL_COST, currentEnergy } from "@/lib/game";
import { Gem, Package, ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecargarEnergia } from "./RecargarEnergia";

export default async function TiendaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);

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
                Ganás gemas cada vez que jugás un duelo.
              </p>
            </div>
            <Gem
              className="w-14 h-14 text-cyan-300"
              style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.7))" }}
            />
          </div>
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Mejoras
        </h2>
        <RecargarEnergia
          gems={user.gems}
          energy={energy}
          max={ENERGY_MAX}
          cost={ENERGY_REFILL_COST}
        />

        <h2 className="font-display text-lg tracking-wide text-text-secondary mt-7 mb-3">
          Sobres
        </h2>
        <div className="rounded-2xl border border-border-soft bg-white/5 p-5 text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30">
            <Package className="w-6 h-6 text-violet-300" />
          </div>
          <p className="mt-3 font-display text-lg text-text-primary">
            Los sobres llegan más adelante
          </p>
          <p className="mt-1 text-sm text-text-tertiary font-body">
            Por ahora las cartas se consiguen de una sola manera: escaneando figuritas de
            verdad.
          </p>
          <Link
            href="/escanear"
            className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-cyan-400/15 border border-cyan-400/40 text-cyan-200 text-sm font-display tracking-wider uppercase hover:bg-cyan-400/25 transition active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            Escanear una figurita
          </Link>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
