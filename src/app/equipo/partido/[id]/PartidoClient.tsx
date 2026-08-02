"use client";

import { Button } from "@/components/Button";
import { PLAY_COST, PLAY_LABELS, SLOT_LABELS, type F5Slot, type PlayType } from "@/lib/futbol5";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PublicPlayer = {
  slot: F5Slot;
  name: string;
  position: string;
  rarity: string;
  rating: number;
  flag: string;
  imageUrl: string | null;
  isAcademy: boolean;
};

type SlotDuel = {
  slot: F5Slot;
  userName: string;
  botName: string;
  userPower: number;
  botPower: number;
  userPoints: number;
  botPoints: number;
  winner: string;
};

type MatchView = {
  id: string;
  status: "active" | "finished";
  result: "win" | "loss" | "draw" | null;
  impulseLeft: number;
  scoreUser: number;
  scoreOpponent: number;
  momentIndex: number;
  momentsTotal: number;
  momentLabel: string;
  activeZone: string;
  activeSlots: F5Slot[];
  styleUser: string;
  styleBot: string;
  connection: number;
  moments: Array<{
    label: string;
    playType: string;
    userPower: number;
    botPower: number;
    userPoints: number;
    botPoints: number;
    winner: string;
    hint: string;
    duels?: SlotDuel[];
  }>;
  you: PublicPlayer[];
  rival: PublicPlayer[];
  rewards: { gems: number; xp: number; trophies: number } | null;
};

export function PartidoClient({ initial }: { initial: MatchView }) {
  const router = useRouter();
  const [match, setMatch] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async (playType: PlayType) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-matches/${match.id}/moment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playType }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo jugar el momento");
        return;
      }
      setMatch(data.match);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (match.status === "finished") {
    const title =
      match.result === "win"
        ? "¡Ganaste el partido!"
        : match.result === "loss"
          ? "Esta vez no fue"
          : "Empate";
    const allDuels = match.moments.flatMap((m) => m.duels ?? []);
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-transparent p-6">
          <p className="font-display text-3xl text-text-primary">{title}</p>
          <p className="mt-2 font-display text-4xl text-cyan-200">
            {match.scoreUser} — {match.scoreOpponent}
          </p>
          {match.rewards && (
            <p className="mt-3 text-sm text-text-tertiary font-body">
              +{match.rewards.gems} gemas · +{match.rewards.xp} XP ·{" "}
              {match.rewards.trophies >= 0 ? "+" : ""}
              {match.rewards.trophies} trofeos
            </p>
          )}
        </div>

        {allDuels.length > 0 && (
          <div className="text-left space-y-2">
            <h2 className="font-display text-sm text-text-secondary">Duelos por puesto</h2>
            {allDuels.map((d, i) => (
              <div
                key={`${d.slot}-${i}`}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm flex justify-between gap-2",
                  d.winner === "user"
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : d.winner === "bot"
                      ? "border-violet-400/40 bg-violet-400/10"
                      : "border-border-soft bg-white/5",
                )}
              >
                <span>
                  <span className="text-text-tertiary text-[11px]">
                    {SLOT_LABELS[d.slot]} ·{" "}
                  </span>
                  {d.userName} vs {d.botName}
                </span>
                <span className="text-[11px] text-text-tertiary shrink-0">
                  +{d.userPoints}/+{d.botPoints}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/equipo">
            <Button variant="ghost" size="md" fullWidth>
              Mi equipo
            </Button>
          </Link>
          <Link href="/ranking">
            <Button variant="cyan" size="md" fullWidth>
              Ver puntos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeSet = new Set(match.activeSlots);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-border-soft bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Vos</div>
          <div className="font-display text-2xl text-cyan-200">{match.scoreUser}</div>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Impulso</div>
          <div className="font-display text-2xl text-amber-300">{match.impulseLeft}</div>
        </div>
        <div className="rounded-2xl border border-border-soft bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Rival</div>
          <div className="font-display text-2xl text-violet-200">{match.scoreOpponent}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-center">
        <p className="text-[11px] font-display tracking-widest uppercase text-cyan-200/80">
          Momento {match.momentIndex + 1}/{match.momentsTotal} · {match.activeZone}
        </p>
        <p className="mt-1 font-display text-2xl text-text-primary">{match.momentLabel}</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Estilo {match.styleUser} · Conexión +{match.connection}%
        </p>
        <p className="mt-2 text-[11px] text-text-muted">
          Pelean: {match.activeSlots.map((s) => SLOT_LABELS[s]).join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LineupColumn
          title="Tu equipo"
          players={match.you}
          accent="cyan"
          activeSlots={activeSet}
        />
        <LineupColumn
          title="Rival"
          players={match.rival}
          accent="violet"
          activeSlots={activeSet}
        />
      </div>

      {match.moments.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-sm text-text-secondary">Últimas jugadas</h2>
          {match.moments.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                m.winner === "user"
                  ? "border-cyan-400/40 bg-cyan-400/10"
                  : m.winner === "bot"
                    ? "border-violet-400/40 bg-violet-400/10"
                    : "border-border-soft bg-white/5",
              )}
            >
              <div className="font-display">{m.label}</div>
              <div className="text-[11px] text-text-tertiary">{m.hint}</div>
              {m.duels && m.duels.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[11px] text-text-secondary">
                  {m.duels.map((d) => (
                    <li key={d.slot}>
                      {SLOT_LABELS[d.slot]}: {d.userName} {d.userPower} vs {d.botName}{" "}
                      {d.botPower}
                      {d.winner === "user"
                        ? ` · +${d.userPoints}`
                        : d.winner === "bot"
                          ? ` · rival +${d.botPoints}`
                          : " · empate"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="space-y-2">
        <p className="text-center text-[11px] text-text-muted">
          Cada ficha suma puntos si gana su puesto. Mejor puesto y más OVR = más puntos.
        </p>
        {(Object.keys(PLAY_COST) as PlayType[]).map((playType) => (
          <Button
            key={playType}
            variant={playType === "total" ? "gold" : playType === "combinado" ? "violet" : "cyan"}
            size="md"
            fullWidth
            disabled={busy || match.impulseLeft < PLAY_COST[playType]}
            onClick={() => void play(playType)}
          >
            {PLAY_LABELS[playType]} · {PLAY_COST[playType]} impulso
          </Button>
        ))}
      </div>
    </div>
  );
}

function LineupColumn({
  title,
  players,
  accent,
  activeSlots,
}: {
  title: string;
  players: PublicPlayer[];
  accent: "cyan" | "violet";
  activeSlots: Set<F5Slot>;
}) {
  const order: F5Slot[] = ["DEL", "MC1", "MC2", "DEF", "POR"];
  const bySlot = new Map(players.map((p) => [p.slot, p]));

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 space-y-2",
        accent === "cyan" ? "border-cyan-400/25 bg-cyan-400/5" : "border-violet-400/25 bg-violet-400/5",
      )}
    >
      <h2 className="font-display text-xs tracking-wider uppercase text-text-tertiary">{title}</h2>
      {order.map((slot) => {
        const p = bySlot.get(slot);
        if (!p) return null;
        const fighting = activeSlots.has(slot);
        return (
          <div
            key={slot}
            className={cn(
              "rounded-xl border px-2 py-1.5 flex items-center gap-2",
              fighting
                ? accent === "cyan"
                  ? "border-cyan-400/50 bg-cyan-400/15"
                  : "border-violet-400/50 bg-violet-400/15"
                : "border-white/10 bg-black/20 opacity-70",
            )}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt=""
                className="w-8 h-8 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-sm shrink-0">
                {p.flag}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-text-tertiary uppercase">
                {SLOT_LABELS[slot]}
              </div>
              <div className="font-display text-xs text-text-primary truncate">{p.name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-sm text-amber-200">{p.rating}</div>
              <div className="text-[9px] text-text-muted">{p.position}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
