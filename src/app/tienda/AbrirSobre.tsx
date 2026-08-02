"use client";

import { Button } from "@/components/Button";
import { PlayerCard, type Position } from "@/components/PlayerCard";
import { PACK_ART } from "@/lib/catalog-data";
import { PACK_COST_GEMS, PACK_SIZE } from "@/lib/futbol5";
import { RARITY_STYLES, type Rarity } from "@/lib/rarity";
import { cn } from "@/lib/cn";
import { Gem, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Pulled = {
  id: string;
  playerName: string;
  position: Position;
  rarity: Rarity;
  rating: number;
  countryFlag: string;
  imageUrl: string | null;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
};

type Phase = "idle" | "loading" | "burst" | "reveal" | "done";

export function AbrirSobre({ gems }: { gems: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulled, setPulled] = useState<Pulled[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealIndex, setRevealIndex] = useState(-1);

  const open = async () => {
    setBusy(true);
    setError(null);
    setPulled(null);
    setRevealIndex(-1);
    setPhase("loading");
    try {
      const res = await fetch("/api/shop/pack", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo abrir");
        setPhase("idle");
        return;
      }
      setPulled(data.cards as Pulled[]);
      setPhase("burst");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  // Después del “estallido” del sobre, empezamos a revelar carta por carta.
  useEffect(() => {
    if (phase !== "burst" || !pulled) return;
    const t = window.setTimeout(() => {
      setPhase("reveal");
      setRevealIndex(0);
    }, 900);
    return () => window.clearTimeout(t);
  }, [phase, pulled]);

  useEffect(() => {
    if (phase !== "reveal" || !pulled) return;
    if (revealIndex < 0) return;
    if (revealIndex >= pulled.length - 1) {
      const t = window.setTimeout(() => setPhase("done"), 700);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setRevealIndex((i) => i + 1), 850);
    return () => window.clearTimeout(t);
  }, [phase, revealIndex, pulled]);

  const closeReveal = () => {
    setPhase("idle");
    setRevealIndex(-1);
  };

  const current = pulled && revealIndex >= 0 ? pulled[revealIndex] : null;
  const glow = current ? RARITY_STYLES[current.rarity].glow : "rgba(34,211,238,0.5)";

  return (
    <>
      <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-cyan-500/5 p-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-40 shrink-0 drop-shadow-[0_8px_24px_rgba(34,211,238,0.35)]">
            <Image
              src={PACK_ART}
              alt="Sobre Battle XI Serie 01"
              fill
              className="object-contain"
              sizes="112px"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-display tracking-widest uppercase text-violet-300/80">
              Serie 01
            </p>
            <div className="font-display text-xl text-text-primary leading-tight">
              Sobre Battle XI
            </div>
            <p className="mt-1 text-[12px] text-text-tertiary font-body">
              {PACK_SIZE} fichas virtuales del catálogo. Tus figuritas cobran vida.
            </p>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <Button
          variant="violet"
          size="md"
          fullWidth
          className="mt-4"
          disabled={busy || gems < PACK_COST_GEMS || phase !== "idle"}
          icon={<Gem className="w-4 h-4" />}
          onClick={() => void open()}
        >
          {busy || phase === "loading"
            ? "Abriendo…"
            : `${PACK_COST_GEMS} gemas · abrir sobre`}
        </Button>
      </div>

      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-4"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,18,40,0.92) 0%, rgba(3,4,12,0.97) 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {(phase === "reveal" || phase === "done") && (
              <button
                type="button"
                onClick={closeReveal}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-text-secondary hover:bg-white/15"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Sobre temblando / explotando */}
            <AnimatePresence>
              {(phase === "loading" || phase === "burst") && (
                <motion.div
                  key="pack"
                  className="relative w-48 h-72 mb-4"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={
                    phase === "burst"
                      ? {
                          scale: [1, 1.15, 0.2],
                          opacity: [1, 1, 0],
                          rotate: [0, -6, 8, 0],
                          filter: [
                            "drop-shadow(0 0 12px rgba(34,211,238,0.4))",
                            "drop-shadow(0 0 40px rgba(168,85,247,0.9))",
                            "drop-shadow(0 0 0px transparent)",
                          ],
                        }
                      : {
                          scale: [1, 1.04, 0.98, 1.03, 1],
                          rotate: [0, -2, 2, -1, 0],
                          opacity: 1,
                        }
                  }
                  transition={
                    phase === "burst"
                      ? { duration: 0.85, ease: "easeIn" }
                      : { duration: 0.55, repeat: Infinity }
                  }
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Image
                    src={PACK_ART}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="192px"
                    priority
                  />
                  {phase === "burst" && (
                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      initial={{ opacity: 0.8, scale: 0.4 }}
                      animate={{ opacity: 0, scale: 2.4 }}
                      transition={{ duration: 0.8 }}
                      style={{
                        background:
                          "radial-gradient(circle, rgba(34,211,238,0.55) 0%, transparent 65%)",
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "loading" && (
              <p className="font-display text-sm tracking-widest uppercase text-cyan-200/80">
                Abriendo sobre…
              </p>
            )}

            {/* Carta actual */}
            <AnimatePresence mode="wait">
              {(phase === "reveal" || phase === "done") && current && pulled && (
                <motion.div
                  key={current.id + revealIndex}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 80, scale: 0.7, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, y: -40, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ perspective: 1000 }}
                >
                  <p
                    className="mb-3 font-display text-sm tracking-[0.2em] uppercase"
                    style={{
                      color: RARITY_STYLES[current.rarity].color,
                      textShadow: `0 0 12px ${glow}`,
                    }}
                  >
                    {RARITY_STYLES[current.rarity].label} · {revealIndex + 1}/
                    {pulled.length}
                  </p>
                  <div
                    className="rounded-2xl"
                    style={{ boxShadow: `0 0 48px ${glow}` }}
                  >
                    <PlayerCard
                      name={current.playerName}
                      rating={current.rating}
                      position={current.position}
                      rarity={current.rarity}
                      countryFlag={current.countryFlag}
                      imageUrl={current.imageUrl ?? undefined}
                      size="md"
                      stats={{
                        vel: current.vel,
                        tir: current.tir,
                        pas: current.pas,
                        reg: current.reg,
                        def: current.def,
                        fis: current.fis,
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Miniaturas ya reveladas */}
            {phase !== "loading" && phase !== "burst" && pulled && (
              <div className="mt-6 flex gap-2 justify-center flex-wrap max-w-sm">
                {pulled.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className={cn(
                      "w-10 h-14 rounded-md border overflow-hidden bg-bg-deep",
                      i <= revealIndex
                        ? "opacity-100"
                        : "opacity-25 border-white/10",
                    )}
                    style={{
                      borderColor:
                        i <= revealIndex
                          ? RARITY_STYLES[c.rarity].color
                          : undefined,
                    }}
                    initial={false}
                    animate={{ scale: i === revealIndex ? 1.12 : 1 }}
                  >
                    {i <= revealIndex && c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {phase === "done" && (
              <motion.div
                className="mt-6 w-full max-w-xs"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button variant="cyan" size="lg" fullWidth onClick={closeReveal}>
                  Guardar en mi colección
                </Button>
              </motion.div>
            )}

            {(phase === "reveal" || phase === "done") && (
              <button
                type="button"
                className="mt-3 text-xs text-text-tertiary underline"
                onClick={() => {
                  if (!pulled) return;
                  setRevealIndex(pulled.length - 1);
                  setPhase("done");
                }}
              >
                Saltar
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
