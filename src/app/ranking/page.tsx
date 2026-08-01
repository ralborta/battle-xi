import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userLevel } from "@/lib/game";
import { Crown, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

const TOP_SIZE = 20;

const MEDAL: Record<number, string> = {
  1: "#fbbf24",
  2: "#cbd5e1",
  3: "#f59e0b",
};

export default async function RankingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [top, betterThanMe] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ trophies: "desc" }, { wins: "desc" }, { createdAt: "asc" }],
      take: TOP_SIZE,
      select: { id: true, nickname: true, trophies: true, xp: true },
    }),
    prisma.user.count({ where: { trophies: { gt: user.trophies } } }),
  ]);

  const players = top.map((p, i) => ({
    pos: i + 1,
    name: p.nickname,
    trophies: p.trophies,
    level: userLevel(p.xp),
    you: p.id === user.id,
  }));

  const myPos = betterThanMe + 1;
  const inTop = players.some((p) => p.you);
  const podium = players.length >= 3 ? [players[1], players[0], players[2]] : [];
  const rest = podium.length ? players.slice(3) : players;

  return (
    <>
      <PageShell
        title="Ranking"
        subtitle={inTop ? "Los mejores del juego" : `Estás en el puesto ${myPos}`}
      >
        {players.length <= 1 ? (
          <div className="rounded-2xl border border-border-soft bg-white/5 p-6 text-center">
            <p className="font-display text-lg text-text-primary">
              Todavía sos el único acá
            </p>
            <p className="mt-2 text-sm text-text-tertiary font-body">
              Invitá a tus amigos a escanear sus figuritas y peleen por el primer puesto.
            </p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-6 items-end">
                {podium.map((p, idx) => {
                  const heights = ["h-24", "h-32", "h-20"];
                  const color = MEDAL[p.pos];
                  return (
                    <div key={p.name} className="flex flex-col items-center">
                      <Crown
                        className="w-5 h-5 mb-1"
                        style={{ color, filter: `drop-shadow(0 0 6px ${color}AA)` }}
                      />
                      <div className="text-xs font-display text-text-secondary truncate w-full text-center">
                        {p.name}
                      </div>
                      <div className="text-[10px] mt-0.5 font-mono" style={{ color }}>
                        {p.trophies}
                      </div>
                      <div
                        className={`mt-1 w-full ${heights[idx]} rounded-t-xl border-t border-x relative overflow-hidden`}
                        style={{
                          background: `linear-gradient(180deg, ${color}40 0%, ${color}10 100%)`,
                          borderColor: `${color}66`,
                          boxShadow: `0 0 16px ${color}33`,
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-2 text-center font-display text-2xl"
                          style={{ color, textShadow: `0 0 8px ${color}` }}
                        >
                          {p.pos}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              {rest.map((p) => (
                <RankRow key={p.name} {...p} />
              ))}
            </div>

            {!inTop && (
              <>
                <p className="mt-5 mb-2 text-center text-[11px] font-display tracking-widest uppercase text-text-muted">
                  Tu puesto
                </p>
                <RankRow
                  pos={myPos}
                  name={user.nickname}
                  trophies={user.trophies}
                  level={userLevel(user.xp)}
                  you
                />
              </>
            )}
          </>
        )}
      </PageShell>
      <BottomNav />
    </>
  );
}

function RankRow({
  pos,
  name,
  trophies,
  level,
  you,
}: {
  pos: number;
  name: string;
  trophies: number;
  level: number;
  you?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center gap-3 rounded-xl p-3 border " +
        (you
          ? "bg-gradient-to-r from-cyan-400/15 to-violet-500/15 border-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
          : "bg-white/5 border-border-soft")
      }
    >
      <div
        className={
          "w-9 h-9 rounded-lg flex items-center justify-center font-display text-base " +
          (you ? "bg-cyan-400/30 text-cyan-100" : "bg-white/5 text-text-tertiary")
        }
      >
        {pos}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={
            "font-display text-base truncate " + (you ? "text-cyan-100" : "text-text-primary")
          }
        >
          {name}
          {you && (
            <span className="ml-2 text-[10px] uppercase tracking-widest text-cyan-300/80">
              vos
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-tertiary">Nivel {level}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm text-amber-300 flex items-center gap-1 justify-end">
          <TrendingUp className="w-3 h-3" />
          {trophies}
        </div>
        <div className="text-[10px] text-text-tertiary uppercase tracking-wider">trofeos</div>
      </div>
    </div>
  );
}
