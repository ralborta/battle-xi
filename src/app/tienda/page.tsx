import { GameGate } from "@/components/GameGate";
import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { Gem, Package, Sparkles, Zap } from "lucide-react";

const PACKS = [
  {
    name: "Pack Pro",
    desc: "5 cartas · 1 garantizada Pro+",
    price: "150",
    icon: Package,
    rarity: "pro" as const,
    color: "#22d3ee",
  },
  {
    name: "Pack Élite",
    desc: "5 cartas · 1 garantizada Élite+",
    price: "450",
    icon: Sparkles,
    rarity: "elite" as const,
    color: "#a855f7",
    featured: true,
  },
  {
    name: "Pack Campeón",
    desc: "7 cartas · 2 garantizadas Élite+",
    price: "900",
    icon: Sparkles,
    rarity: "champion" as const,
    color: "#fbbf24",
  },
];

const POWERS = [
  { name: "Boost de XP x2", desc: "1 hora", price: 50, icon: Zap },
  { name: "Energía completa", desc: "Recarga +20", price: 80, icon: Zap },
  { name: "Slot extra de carta", desc: "Permanente", price: 200, icon: Package },
];

export default function TiendaPage() {
  return (
    <GameGate>
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
                340
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
        <div className="space-y-3 mb-7">
          {PACKS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="relative overflow-hidden rounded-2xl p-4 border"
                style={{
                  background: `linear-gradient(135deg, ${p.color}15 0%, ${p.color}05 100%)`,
                  borderColor: `${p.color}50`,
                  boxShadow: p.featured ? `0 0 24px ${p.color}33` : undefined,
                }}
              >
                {p.featured && (
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-display tracking-widest uppercase"
                    style={{
                      background: `${p.color}`,
                      color: "#03040c",
                      boxShadow: `0 0 10px ${p.color}`,
                    }}
                  >
                    Mejor valor
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`,
                      boxShadow: `0 0 16px ${p.color}80`,
                    }}
                  >
                    <Icon className="w-7 h-7 text-bg-void" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg text-text-primary leading-tight">
                      {p.name}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">{p.desc}</div>
                  </div>
                </div>
                <Button
                  variant={p.rarity === "pro" ? "cyan" : p.rarity === "elite" ? "violet" : "gold"}
                  size="md"
                  fullWidth
                  className="mt-3"
                  icon={<Gem className="w-4 h-4" />}
                >
                  {p.price} gemas
                </Button>
              </div>
            );
          })}
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Mejoras
        </h2>
        <div className="space-y-2">
          {POWERS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-xl p-3 bg-white/5 border border-border-soft"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/40">
                  <Icon className="w-5 h-5 text-violet-300" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-sm text-text-primary">{p.name}</div>
                  <div className="text-[11px] text-text-tertiary">{p.desc}</div>
                </div>
                <button className="px-3 h-9 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-200 text-xs font-display tracking-wider uppercase flex items-center gap-1 hover:bg-cyan-400/25 transition active:scale-95">
                  <Gem className="w-3 h-3" />
                  {p.price}
                </button>
              </div>
            );
          })}
        </div>
      </PageShell>
      <BottomNav />
    </>
    </GameGate>
  );
}
