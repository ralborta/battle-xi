"use client";

import { Button } from "@/components/Button";
import { PLAY_COST, PLAY_LABELS, type PlayType } from "@/lib/futbol5";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  styleUser: string;
  moments: Array<{
    label: string;
    playType: string;
    userPower: number;
    botPower: number;
    userPoints: number;
    botPoints: number;
    winner: string;
    hint: string;
  }>;
  you: Array<{
    slot: string;
    name: string;
    rating: number;
    flag: string;
    isAcademy: boolean;
  }>;
  rivalZones: Array<{
    zone: string;
    range: [number, number];
    cards: Array<{ name: string; rarity: string; flag: string }>;
  }>;
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
          Momento {match.momentIndex + 1}/{match.momentsTotal}
        </p>
        <p className="mt-1 font-display text-2xl text-text-primary">{match.momentLabel}</p>
        <p className="mt-1 text-xs text-text-tertiary">Estilo: {match.styleUser}</p>
      </div>

      <div>
        <h2 className="font-display text-sm text-text-secondary mb-2">Lectura del rival</h2>
        <div className="space-y-2">
          {match.rivalZones.map((z) => (
            <div
              key={z.zone}
              className="rounded-xl border border-border-soft bg-white/5 px-3 py-2 flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-display text-sm capitalize text-text-primary">{z.zone}</div>
                <div className="text-[11px] text-text-tertiary">
                  {z.cards.map((c) => c.name).join(" · ") || "—"}
                </div>
              </div>
              <div className="text-right text-xs text-amber-200 font-mono">
                {z.range[0]}–{z.range[1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {match.moments.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-sm text-text-secondary">Jugadas</h2>
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
              <div className="text-[11px] text-text-tertiary">
                {m.hint} · {m.userPower} vs {m.botPower} · +{m.userPoints}/+{m.botPoints}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="space-y-2">
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
