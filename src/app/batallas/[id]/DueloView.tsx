"use client";

import { BattleLogo } from "@/components/BattleLogo";
import { Button } from "@/components/Button";
import { PlayerCard } from "@/components/PlayerCard";
import { cn } from "@/lib/cn";
import { STAT_KEYS, STAT_LABELS, type BattleView, type StatKey } from "@/lib/game";
import { ArrowLeft, Bot, Gem, Swords, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const RESULT_COPY = {
  win: { title: "¡Victoria!", tone: "text-cyan-200", border: "border-cyan-400/50 bg-gradient-to-b from-cyan-500/20 to-transparent", shadow: "0 0 20px rgba(34,211,238,0.6)" },
  loss: { title: "Derrota", tone: "text-violet-200", border: "border-violet-500/50 bg-gradient-to-b from-violet-600/20 to-transparent", shadow: "0 0 20px rgba(168,85,247,0.5)" },
  draw: { title: "Empate", tone: "text-amber-200", border: "border-amber-400/50 bg-gradient-to-b from-amber-500/15 to-transparent", shadow: "0 0 20px rgba(251,191,36,0.4)" },
} as const;

export function DueloView({ initial }: { initial: BattleView }) {
  const router = useRouter();
  const [battle, setBattle] = useState(initial);
  const [pending, setPending] = useState<StatKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastRound = battle.rounds.at(-1) ?? null;
  const finished = battle.status === "finished";

  const play = async (stat: StatKey) => {
    setError(null);
    setPending(stat);
    try {
      const res = await fetch(`/api/battles/${battle.id}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
      const data = (await res.json().catch(() => null)) as
        | { battle?: BattleView; error?: string }
        | null;

      if (!res.ok || !data?.battle) {
        setError(data?.error ?? "No pudimos jugar la ronda. Probá de nuevo.");
        return;
      }
      setBattle(data.battle);
      if (data.battle.status === "finished") router.refresh();
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y reintentá.");
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium pb-safe">
      <div className="absolute inset-0 grid-arena opacity-30 pointer-events-none" />

      <header className="relative z-20 flex items-center gap-3 px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <Link
          href="/batallas"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-soft bg-white/5 hover:bg-white/10 transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-text-primary truncate tracking-wide">
            Duelo contra {battle.opponent.nickname}
          </p>
          <p className="text-xs text-text-tertiary font-body truncate flex items-center gap-1">
            {battle.opponent.isBot && <Bot className="h-3 w-3" />}
            {battle.opponent.isBot
              ? "Rival del sistema · todavía no hay otros clubes"
              : `Carta de ${battle.opponent.nickname}`}
          </p>
        </div>
      </header>

      <div className="relative z-10 max-w-md mx-auto px-4 pb-10">
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="text-center">
            <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary">
              Vos
            </p>
            <p
              className="font-display text-3xl text-cyan-200"
              style={{ textShadow: "0 0 12px rgba(34,211,238,0.5)" }}
            >
              {battle.scoreUser}
            </p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] font-display uppercase tracking-widest text-violet-300 mb-1">
              {finished
                ? "Final"
                : `Ronda ${Math.min(battle.roundIndex + 1, battle.roundsTotal)} / ${battle.roundsTotal}`}
            </p>
            <Swords className="h-6 w-6 text-cyan-300 mx-auto" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary">
              Rival
            </p>
            <p
              className="font-display text-3xl text-violet-300"
              style={{ textShadow: "0 0 12px rgba(168,85,247,0.5)" }}
            >
              {battle.scoreOpponent}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-5">
          <PlayerCard
            name={battle.you.name}
            rating={battle.you.rating}
            position={battle.you.position}
            rarity={battle.you.rarity}
            countryFlag={battle.you.flag}
            level={battle.you.level}
            imageUrl={battle.you.imageUrl ?? undefined}
            size="sm"
            stats={battle.you.stats}
            className={cn(
              "transition-all duration-300",
              lastRound?.winner === "user" && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-bg-void",
            )}
          />
          <PlayerCard
            name={battle.opponent.name}
            rating={battle.opponent.rating}
            position={battle.opponent.position}
            rarity={battle.opponent.rarity}
            countryFlag={battle.opponent.flag}
            level={battle.opponent.level}
            imageUrl={battle.opponent.imageUrl ?? undefined}
            size="sm"
            hideStats={!finished}
            stats={{ vel: 0, tir: 0, pas: 0, reg: 0, def: 0, fis: 0 }}
            className={cn(
              "transition-all duration-300",
              lastRound?.winner === "opponent" &&
                "ring-2 ring-violet-400 ring-offset-2 ring-offset-bg-void",
            )}
          />
        </div>

        {lastRound && (
          <div className="rounded-2xl border border-border-soft bg-white/5 p-4 mb-5 text-center">
            <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary mb-2">
              {STAT_LABELS[lastRound.stat].long}
            </p>
            <div className="flex justify-around items-center gap-4">
              <div>
                <span
                  className={cn(
                    "font-display text-2xl",
                    lastRound.winner === "user" ? "text-cyan-200" : "text-text-secondary",
                  )}
                >
                  {lastRound.userValue}
                </span>
                <p className="text-[10px] text-text-muted font-body">
                  {battle.you.stats[lastRound.stat]} +{battle.you.levelBonus + lastRound.userPush}
                </p>
              </div>
              <span className="text-text-muted">—</span>
              <div>
                <span
                  className={cn(
                    "font-display text-2xl",
                    lastRound.winner === "opponent" ? "text-violet-200" : "text-text-secondary",
                  )}
                >
                  {lastRound.opponentValue}
                </span>
                <p className="text-[10px] text-text-muted font-body">con empuje</p>
              </div>
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-display",
                lastRound.winner === "user" && "text-cyan-200",
                lastRound.winner === "opponent" && "text-violet-200",
                lastRound.winner === "tie" && "text-amber-300",
              )}
            >
              {lastRound.winner === "user" && "¡Ganaste la ronda!"}
              {lastRound.winner === "opponent" && "El rival se llevó esta…"}
              {lastRound.winner === "tie" && "¡Empate! Nadie suma"}
            </p>
          </div>
        )}

        {error && <p className="mb-4 text-center text-sm text-red-400 font-body">{error}</p>}

        {!finished ? (
          <>
            <p className="text-center text-sm text-text-tertiary font-body mb-3">
              Elegí con qué habilidad atacás. Cada una se usa una sola vez.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STAT_KEYS.map((stat) => {
                const used = battle.usedStats.includes(stat);
                return (
                  <button
                    key={stat}
                    type="button"
                    disabled={used || pending !== null}
                    onClick={() => void play(stat)}
                    className={cn(
                      "rounded-2xl border p-3 text-center transition active:scale-95",
                      used
                        ? "border-border-soft bg-white/5 opacity-40"
                        : "border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 shadow-[0_0_12px_rgba(34,211,238,0.2)]",
                      pending === stat && "animate-pulse",
                    )}
                  >
                    <span className="block text-[10px] font-display uppercase tracking-widest text-text-tertiary">
                      {STAT_LABELS[stat].short}
                    </span>
                    <span className="block font-display text-2xl text-cyan-100">
                      {battle.you.stats[stat]}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center animate-[rise_0.5s_ease-out_both]">
            <div className="flex justify-center mb-4">
              <BattleLogo size="sm" />
            </div>

            {battle.result && (
              <div className={cn("rounded-3xl border p-8 mb-6", RESULT_COPY[battle.result].border)}>
                <p className="text-[11px] font-display tracking-[0.3em] uppercase text-text-tertiary mb-2">
                  Resultado
                </p>
                <h1
                  className={cn("font-display text-4xl mb-2", RESULT_COPY[battle.result].tone)}
                  style={{ textShadow: RESULT_COPY[battle.result].shadow }}
                >
                  {RESULT_COPY[battle.result].title}
                </h1>
                <p className="text-text-secondary font-body text-sm mb-4">
                  Marcador final: {battle.scoreUser} — {battle.scoreOpponent}
                </p>
                {battle.rewards && (
                  <div className="flex flex-wrap justify-center gap-3 text-sm font-display">
                    <span className="text-cyan-200 flex items-center gap-1">
                      <Zap className="h-4 w-4" />+{battle.rewards.xp} XP
                    </span>
                    {battle.rewards.gems > 0 && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <Gem className="h-4 w-4" />+{battle.rewards.gems} gemas
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        battle.rewards.trophies >= 0 ? "text-violet-200" : "text-text-tertiary",
                      )}
                    >
                      <Trophy className="h-4 w-4" />
                      {battle.rewards.trophies >= 0 ? "+" : ""}
                      {battle.rewards.trophies} trofeos
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Link href="/batallas/nueva" className="block">
                <Button variant="cyan" size="lg" fullWidth icon={<Swords className="h-5 w-5" />}>
                  Otro duelo
                </Button>
              </Link>
              <Link href="/batallas" className="block">
                <Button variant="ghost" size="md" fullWidth>
                  Volver a batallas
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
