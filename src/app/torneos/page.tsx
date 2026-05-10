import { GameGate } from "@/components/GameGate";
import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Trophy3D } from "@/components/Trophy3D";
import { Button } from "@/components/Button";
import { Trophy, Calendar, Crown } from "lucide-react";

export default function TorneosPage() {
  return (
    <GameGate>
    <>
      <PageShell title="Torneos" subtitle="La copa te espera">
        <div className="relative flex flex-col items-center mb-6 pt-2">
          <Trophy3D size={200} />
          <div className="-mt-4 text-center">
            <p className="font-display text-2xl tracking-wide text-text-primary">
              Copa Semanal
            </p>
            <p className="mt-1 text-xs text-text-tertiary font-body">
              Termina en <span className="text-cyan-300 font-bold">3d 14h 22m</span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-amber-700/5 p-5 mb-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-300 text-[11px] font-display tracking-widest uppercase">
              <Crown className="w-4 h-4" />
              Premio Mayor
            </div>
            <div className="mt-2 font-display text-3xl text-text-primary leading-tight">
              500 Gemas
              <span className="block text-base text-amber-200/90 mt-1">
                + Carta Legendaria garantizada
              </span>
            </div>
            <Button variant="gold" size="md" fullWidth className="mt-4" icon={<Trophy className="w-4 h-4" />}>
              Entrar al torneo
            </Button>
          </div>
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Más competencias
        </h2>
        <div className="space-y-3">
          {[
            { name: "Copa Diaria", time: "Termina en 14h", prize: "80 gemas", icon: Calendar, color: "#22d3ee" },
            { name: "Liga Novatos", time: "Abierta", prize: "Pack Pro", icon: Trophy, color: "#a855f7" },
            { name: "Copa de Amigos", time: "Crear sala", prize: "Apuesta libre", icon: Crown, color: "#fbbf24" },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white/5 backdrop-blur-md p-3"
              >
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-xl"
                  style={{
                    background: `${t.color}22`,
                    border: `1px solid ${t.color}66`,
                    boxShadow: `0 0 12px ${t.color}40`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: t.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-display text-base text-text-primary leading-tight">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-text-tertiary">{t.time}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-display tracking-widest uppercase text-text-tertiary">
                    Premio
                  </div>
                  <div className="text-sm text-cyan-200 font-display">{t.prize}</div>
                </div>
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
