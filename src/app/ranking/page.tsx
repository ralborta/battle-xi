import { GameGate } from "@/components/GameGate";
import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Crown, TrendingUp } from "lucide-react";

const RANKING = [
  { pos: 1, name: "Tincho", trophies: 2840, level: 32 },
  { pos: 2, name: "MartaXI", trophies: 2710, level: 30 },
  { pos: 3, name: "ElPibe10", trophies: 2655, level: 29 },
  { pos: 4, name: "Sofi_22", trophies: 2410, level: 27 },
  { pos: 5, name: "BraianGoal", trophies: 2380, level: 26 },
  { pos: 6, name: "JuliCapi", trophies: 2210, level: 24 },
  { pos: 7, name: "Mati_DF", trophies: 2050, level: 23 },
  { pos: 8, name: "Tú", trophies: 1980, level: 22, you: true },
  { pos: 9, name: "Naza_07", trophies: 1850, level: 21 },
  { pos: 10, name: "RomiTuya", trophies: 1720, level: 20 },
];

const MEDAL: Record<number, string> = {
  1: "#fbbf24",
  2: "#cbd5e1",
  3: "#f59e0b",
};

export default function RankingPage() {
  return (
    <GameGate>
    <>
      <PageShell title="Ranking" subtitle="Global · Semana actual">
        <div className="flex gap-2 mb-5">
          {["Global", "Amigos", "Liga"].map((t, i) => (
            <button
              key={t}
              className={
                "flex-1 h-10 rounded-xl text-sm font-display tracking-wider uppercase transition " +
                (i === 0
                  ? "bg-gradient-to-r from-cyan-400/30 to-violet-500/30 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.3)] border border-cyan-400/40"
                  : "bg-white/5 text-text-tertiary border border-border-soft hover:bg-white/10")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 items-end">
          {[RANKING[1], RANKING[0], RANKING[2]].map((p, idx) => {
            const realPos = p.pos;
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div key={p.name} className="flex flex-col items-center">
                <Crown
                  className="w-5 h-5 mb-1"
                  style={{ color: MEDAL[realPos], filter: `drop-shadow(0 0 6px ${MEDAL[realPos]}AA)` }}
                />
                <div className="text-xs font-display text-text-secondary truncate w-full text-center">
                  {p.name}
                </div>
                <div
                  className="text-[10px] mt-0.5 font-mono"
                  style={{ color: MEDAL[realPos] }}
                >
                  {p.trophies}
                </div>
                <div
                  className={`mt-1 w-full ${heights[idx]} rounded-t-xl border-t border-x relative overflow-hidden`}
                  style={{
                    background: `linear-gradient(180deg, ${MEDAL[realPos]}40 0%, ${MEDAL[realPos]}10 100%)`,
                    borderColor: `${MEDAL[realPos]}66`,
                    boxShadow: `0 0 16px ${MEDAL[realPos]}33`,
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-2 text-center font-display text-2xl"
                    style={{ color: MEDAL[realPos], textShadow: `0 0 8px ${MEDAL[realPos]}` }}
                  >
                    {realPos}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {RANKING.slice(3).map((p) => (
            <div
              key={p.name}
              className={
                "flex items-center gap-3 rounded-xl p-3 border " +
                (p.you
                  ? "bg-gradient-to-r from-cyan-400/15 to-violet-500/15 border-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                  : "bg-white/5 border-border-soft")
              }
            >
              <div
                className={
                  "w-9 h-9 rounded-lg flex items-center justify-center font-display text-base " +
                  (p.you ? "bg-cyan-400/30 text-cyan-100" : "bg-white/5 text-text-tertiary")
                }
              >
                {p.pos}
              </div>
              <div className="flex-1">
                <div className={"font-display text-base " + (p.you ? "text-cyan-100" : "text-text-primary")}>
                  {p.name}
                  {p.you && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-cyan-300/80">
                      vos
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-tertiary">Nivel {p.level}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-amber-300 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3" />
                  {p.trophies}
                </div>
                <div className="text-[10px] text-text-tertiary uppercase tracking-wider">trofeos</div>
              </div>
            </div>
          ))}
        </div>
      </PageShell>
      <BottomNav />
    </>
    </GameGate>
  );
}
