"use client";

import { BattleLogo } from "@/components/BattleLogo";
import { Button } from "@/components/Button";
import { PlayerCard, type PlayerStats } from "@/components/PlayerCard";
import { cn } from "@/lib/cn";
import { ArrowLeft, Gem, Swords, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Rarity = "pro" | "elite" | "champion";

type Phase = "vs" | "fighting" | "result";

type StatKey = keyof PlayerStats;

const ROUNDS: { key: StatKey; label: string; short: string }[] = [
  { key: "vel", label: "Velocidad", short: "VEL" },
  { key: "tir", label: "Tiro", short: "TIR" },
  { key: "reg", label: "Regate", short: "REG" },
  { key: "fis", label: "Físico", short: "FÍS" },
];

const YOU = {
  name: "Vicente",
  rating: 89,
  position: "DEL" as const,
  rarity: "elite" as Rarity,
  countryFlag: "🇦🇷",
  level: 7,
  stats: { vel: 92, tir: 89, pas: 81, reg: 90, def: 38, fis: 81 } satisfies PlayerStats,
};

const RIVAL = {
  name: "Kairo",
  rating: 87,
  position: "MC" as const,
  rarity: "pro" as Rarity,
  countryFlag: "🇧🇷",
  level: 9,
  stats: { vel: 95, tir: 84, pas: 91, reg: 87, def: 72, fis: 88 } satisfies PlayerStats,
};

export function BatallaEmuladaView() {
  const [phase, setPhase] = useState<Phase>("vs");
  const [roundIndex, setRoundIndex] = useState(0);
  const [scoreYou, setScoreYou] = useState(0);
  const [scoreRival, setScoreRival] = useState(0);
  const scoresRef = useRef({ you: 0, rival: 0 });
  const [roundRevealed, setRoundRevealed] = useState(false);
  const [lastWinner, setLastWinner] = useState<"you" | "rival" | "tie" | null>(null);
  const [resultKind, setResultKind] = useState<"win" | "lose" | "draw" | null>(null);

  const reset = useCallback(() => {
    setPhase("vs");
    setRoundIndex(0);
    setScoreYou(0);
    setScoreRival(0);
    scoresRef.current = { you: 0, rival: 0 };
    setRoundRevealed(false);
    setLastWinner(null);
    setResultKind(null);
  }, []);

  const startFight = () => {
    scoresRef.current = { you: 0, rival: 0 };
    setScoreYou(0);
    setScoreRival(0);
    setRoundIndex(0);
    setRoundRevealed(false);
    setLastWinner(null);
    setResultKind(null);
    setPhase("fighting");
  };

  const finalize = useCallback(() => {
    const { you: y, rival: r } = scoresRef.current;
    let res: "win" | "lose" | "draw";
    if (y > r) res = "win";
    else if (r > y) res = "lose";
    else res = "draw";
    setScoreYou(y);
    setScoreRival(r);
    setResultKind(res);
    setPhase("result");
  }, []);

  /** Fase batalla: revelar ronda o pasar a la siguiente / fin */
  useEffect(() => {
    if (phase !== "fighting") return;

    if (roundIndex >= ROUNDS.length) {
      finalize();
      return;
    }

    const round = ROUNDS[roundIndex];

    if (!roundRevealed) {
      const reveal = window.setTimeout(() => {
        const y = YOU.stats[round.key];
        const r = RIVAL.stats[round.key];
        let w: "you" | "rival" | "tie";
        if (y > r) w = "you";
        else if (r > y) w = "rival";
        else w = "tie";

        setLastWinner(w);
        if (w === "you") {
          scoresRef.current.you += 1;
          setScoreYou(scoresRef.current.you);
        } else if (w === "rival") {
          scoresRef.current.rival += 1;
          setScoreRival(scoresRef.current.rival);
        }
        setRoundRevealed(true);
      }, 900);

      return () => window.clearTimeout(reveal);
    }

    const advance = window.setTimeout(() => {
      setRoundRevealed(false);
      setLastWinner(null);
      setRoundIndex((i) => i + 1);
    }, 1600);

    return () => window.clearTimeout(advance);
  }, [phase, roundIndex, roundRevealed, finalize]);

  const currentRound = phase === "fighting" && roundIndex < ROUNDS.length ? ROUNDS[roundIndex] : null;

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
            Batalla emulada
          </p>
          <p className="text-xs text-text-tertiary font-body truncate">
            Duelo 1 vs 1 · stats en vivo
          </p>
        </div>
      </header>

      <div className="relative z-10 max-w-md mx-auto px-4 pb-8">
        {phase === "vs" && (
          <div className="animate-[rise_0.5s_ease-out_both]">
            <div className="flex justify-center my-4">
              <div
                className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 flex items-center gap-2"
                style={{ boxShadow: "0 0 20px rgba(251,191,36,0.25)" }}
              >
                <Gem className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-display text-amber-200">Premio: 25 gemas · +150 XP</span>
              </div>
            </div>

            <div className="relative flex items-center justify-center gap-0 my-6">
              <div className="flex-1 flex justify-end pr-1 -rotate-6">
                <PlayerCard {...YOU} size="sm" rotate={-6} />
              </div>
              <div
                className="z-10 shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 border-cyan-400/60 bg-bg-deep/90 backdrop-blur-md"
                style={{ boxShadow: "0 0 24px rgba(34,211,238,0.45)" }}
              >
                <Swords className="h-6 w-6 text-cyan-300 mb-0.5" />
                <span className="font-display text-xl italic text-text-primary leading-none">VS</span>
              </div>
              <div className="flex-1 flex justify-start pl-1 rotate-6">
                <PlayerCard {...RIVAL} size="sm" rotate={6} />
              </div>
            </div>

            <p className="text-center text-sm text-text-tertiary font-body mb-6">
              Cuatro rondas: comparan VEL, TIR, REG y FÍS. Cada ronda ganada suma un punto.
            </p>

            <Button
              variant="cyan"
              size="xl"
              fullWidth
              icon={<Zap className="h-5 w-5" />}
              onClick={startFight}
            >
              Comenzar duelo
            </Button>
          </div>
        )}

        {phase === "fighting" && currentRound && (
          <div className="animate-[rise_0.35s_ease-out_both]">
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="text-center">
                <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary">
                  Vos
                </p>
                <p
                  className="font-display text-3xl text-cyan-200"
                  style={{ textShadow: "0 0 12px rgba(34,211,238,0.5)" }}
                >
                  {scoreYou}
                </p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] font-display uppercase tracking-widest text-violet-300 mb-1">
                  Ronda {roundIndex + 1} / {ROUNDS.length}
                </p>
                <p className="font-display text-lg text-text-primary">{currentRound.label}</p>
                <p className="text-xs text-text-tertiary font-body">{currentRound.short}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary">
                  Rival
                </p>
                <p
                  className="font-display text-3xl text-violet-300"
                  style={{ textShadow: "0 0 12px rgba(168,85,247,0.5)" }}
                >
                  {scoreRival}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-center mb-6">
              <PlayerCard
                {...YOU}
                size="sm"
                rotate={0}
                className={cn(
                  "transition-all duration-300",
                  roundRevealed && lastWinner === "you" && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-bg-void scale-[1.03]",
                )}
              />
              <PlayerCard
                {...RIVAL}
                size="sm"
                rotate={0}
                className={cn(
                  "transition-all duration-300",
                  roundRevealed && lastWinner === "rival" && "ring-2 ring-violet-400 ring-offset-2 ring-offset-bg-void scale-[1.03]",
                )}
              />
            </div>

            {!roundRevealed ? (
              <div className="h-24 flex items-center justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-400/60 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border-soft bg-white/5 p-4 mb-4 text-center">
                <div className="flex justify-around items-center gap-4 font-mono text-2xl">
                  <span className={cn("font-display", lastWinner === "you" && "text-cyan-200 scale-110")}>
                    {YOU.stats[currentRound.key]}
                  </span>
                  <span className="text-text-muted">—</span>
                  <span className={cn("font-display", lastWinner === "rival" && "text-violet-200 scale-110")}>
                    {RIVAL.stats[currentRound.key]}
                  </span>
                </div>
                {lastWinner === "tie" && (
                  <p className="mt-2 text-sm text-amber-300 font-display">¡Empate! Nadie suma</p>
                )}
                {lastWinner === "you" && (
                  <p className="mt-2 text-sm text-cyan-200 font-display">¡Ganaste la ronda!</p>
                )}
                {lastWinner === "rival" && (
                  <p className="mt-2 text-sm text-violet-200 font-display">El rival lleva esta…</p>
                )}
              </div>
            )}
          </div>
        )}

        {phase === "result" && resultKind && (
          <div className="animate-[rise_0.5s_ease-out_both] text-center">
            <div className="flex justify-center mb-4">
              <BattleLogo size="sm" />
            </div>

            <div
              className={cn(
                "rounded-3xl border p-8 mb-6",
                resultKind === "win" && "border-cyan-400/50 bg-gradient-to-b from-cyan-500/20 to-transparent",
                resultKind === "lose" && "border-violet-500/50 bg-gradient-to-b from-violet-600/20 to-transparent",
                resultKind === "draw" && "border-amber-400/50 bg-gradient-to-b from-amber-500/15 to-transparent",
              )}
            >
              <p className="text-[11px] font-display tracking-[0.3em] uppercase text-text-tertiary mb-2">
                Resultado
              </p>
              <h1
                className={cn(
                  "font-display text-4xl mb-2",
                  resultKind === "win" && "text-cyan-200",
                  resultKind === "lose" && "text-violet-200",
                  resultKind === "draw" && "text-amber-200",
                )}
                style={{
                  textShadow:
                    resultKind === "win"
                      ? "0 0 20px rgba(34,211,238,0.6)"
                      : resultKind === "lose"
                        ? "0 0 20px rgba(168,85,247,0.5)"
                        : "0 0 20px rgba(251,191,36,0.4)",
                }}
              >
                {resultKind === "win" && "¡Victoria!"}
                {resultKind === "lose" && "Derrota"}
                {resultKind === "draw" && "Empate"}
              </h1>
              <p className="text-text-secondary font-body text-sm mb-4">
                Marcador final: {scoreYou} — {scoreRival}
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm font-display">
                {resultKind === "win" && (
                  <>
                    <span className="text-cyan-200">+150 XP</span>
                    <span className="text-amber-300 flex items-center gap-1">
                      <Gem className="h-4 w-4" />
                      +25 gemas
                    </span>
                  </>
                )}
                {resultKind === "lose" && (
                  <span className="text-text-tertiary">+40 XP · seguí entrenando</span>
                )}
                {resultKind === "draw" && (
                  <span className="text-amber-200/90">+90 XP · +8 gemas</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="cyan" size="lg" fullWidth onClick={reset}>
                Revancha
              </Button>
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
