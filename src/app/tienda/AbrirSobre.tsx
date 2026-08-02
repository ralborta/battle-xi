"use client";

import { Button } from "@/components/Button";
import { PlayerCard, type Position } from "@/components/PlayerCard";
import { PACK_ART } from "@/lib/catalog-data";
import { COLLECTION_MAX, PACK_COST_GEMS, PACK_SIZE } from "@/lib/futbol5";
import { RARITY_STYLES, type Rarity } from "@/lib/rarity";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Gem, X } from "lucide-react";
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

type Phase = "idle" | "loading" | "burst" | "reveal" | "review";

const BURST_MS = 1200;
/** Tiempo mínimo mirando cada carta antes de poder pasar (auto más lento). */
const CARD_DWELL_MS = 3200;

export function AbrirSobre({
  gems,
  collectionCount = 0,
}: {
  gems: number;
  collectionCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulled, setPulled] = useState<Pulled[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealIndex, setRevealIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

  const roomLeft = COLLECTION_MAX - collectionCount;
  const packBlocked = roomLeft < PACK_SIZE;

  const open = async () => {
    setBusy(true);
    setError(null);
    setPulled(null);
    setRevealIndex(0);
    setCanAdvance(false);
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

  useEffect(() => {
    if (phase !== "burst" || !pulled) return;
    const t = window.setTimeout(() => {
      setPhase("reveal");
      setRevealIndex(0);
      setCanAdvance(false);
    }, BURST_MS);
    return () => window.clearTimeout(t);
  }, [phase, pulled]);

  // En reveal: esperar CARD_DWELL_MS y luego avanzar solo (lento) o permitir botón.
  useEffect(() => {
    if (phase !== "reveal" || !pulled) return;
    setCanAdvance(false);
    const unlock = window.setTimeout(() => setCanAdvance(true), 1400);
    const auto = window.setTimeout(() => {
      if (revealIndex >= pulled.length - 1) {
        setPhase("review");
      } else {
        setRevealIndex((i) => i + 1);
      }
    }, CARD_DWELL_MS);
    return () => {
      window.clearTimeout(unlock);
      window.clearTimeout(auto);
    };
  }, [phase, revealIndex, pulled]);

  const closeReveal = () => {
    setPhase("idle");
    setRevealIndex(0);
    setPulled(null);
  };

  const goNext = () => {
    if (!pulled || !canAdvance) return;
    if (revealIndex >= pulled.length - 1) {
      setPhase("review");
      return;
    }
    setRevealIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (!pulled) return;
    if (phase === "review") {
      setPhase("reveal");
      setRevealIndex(pulled.length - 1);
      setCanAdvance(true);
      return;
    }
    if (revealIndex > 0) {
      setRevealIndex((i) => i - 1);
      setCanAdvance(true);
    }
  };

  const current = pulled && phase !== "review" ? pulled[revealIndex] : null;
  const glow = current ? RARITY_STYLES[current.rarity].glow : "rgba(34,211,238,0.5)";
  const reviewCard = pulled && phase === "review" ? pulled[revealIndex] ?? pulled[0] : null;

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
              {PACK_SIZE} fichas · cupo {collectionCount}/{COLLECTION_MAX}
            </p>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {packBlocked && (
          <p className="mt-2 text-sm text-amber-300">
            Club lleno. Vendé fichas en Colección para abrir otro sobre.
          </p>
        )}

        <Button
          variant="violet"
          size="md"
          fullWidth
          className="mt-4"
          disabled={
            busy || gems < PACK_COST_GEMS || phase !== "idle" || packBlocked
          }
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
            {(phase === "reveal" || phase === "review") && (
              <button
                type="button"
                onClick={closeReveal}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-text-secondary hover:bg-white/15"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}

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
                        }
                      : {
                          scale: [1, 1.04, 0.98, 1.03, 1],
                          rotate: [0, -2, 2, -1, 0],
                          opacity: 1,
                        }
                  }
                  transition={
                    phase === "burst"
                      ? { duration: 1.1, ease: "easeIn" }
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
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "loading" && (
              <p className="font-display text-sm tracking-widest uppercase text-cyan-200/80">
                Abriendo sobre…
              </p>
            )}

            {/* Reveal una a una (lento) */}
            <AnimatePresence mode="wait">
              {phase === "reveal" && current && pulled && (
                <motion.div
                  key={current.id}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 60, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
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
                  <div style={{ boxShadow: `0 0 48px ${glow}` }} className="rounded-2xl">
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
                  <div className="mt-5 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="md"
                      disabled={revealIndex === 0}
                      icon={<ChevronLeft className="w-4 h-4" />}
                      onClick={goPrev}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="cyan"
                      size="md"
                      disabled={!canAdvance}
                      icon={<ChevronRight className="w-4 h-4" />}
                      onClick={goNext}
                    >
                      {revealIndex >= pulled.length - 1 ? "Ver todas" : "Siguiente"}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted">
                    {canAdvance
                      ? "Podés pasar cuando quieras"
                      : "Mirá bien la ficha…"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review: ver todas y volver a abrir cada una */}
            {phase === "review" && pulled && (
              <motion.div
                className="w-full max-w-md flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-display text-lg text-text-primary mb-1">
                  Tus fichas nuevas
                </p>
                <p className="text-xs text-text-tertiary mb-4">
                  Tocá una para verla de nuevo
                </p>

                {reviewCard && (
                  <div className="mb-4">
                    <PlayerCard
                      name={reviewCard.playerName}
                      rating={reviewCard.rating}
                      position={reviewCard.position}
                      rarity={reviewCard.rarity}
                      countryFlag={reviewCard.countryFlag}
                      imageUrl={reviewCard.imageUrl ?? undefined}
                      size="md"
                      stats={{
                        vel: reviewCard.vel,
                        tir: reviewCard.tir,
                        pas: reviewCard.pas,
                        reg: reviewCard.reg,
                        def: reviewCard.def,
                        fis: reviewCard.fis,
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-center flex-wrap mb-5">
                  {pulled.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRevealIndex(i)}
                      className={cn(
                        "w-12 h-16 rounded-md border overflow-hidden",
                        i === revealIndex
                          ? "ring-2 ring-cyan-300 scale-110"
                          : "opacity-80",
                      )}
                      style={{ borderColor: RARITY_STYLES[c.rarity].color }}
                    >
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt={c.playerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px]">
                          {c.rating}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-xs space-y-2">
                  <Button variant="cyan" size="lg" fullWidth onClick={closeReveal}>
                    Guardar en mi colección
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setPhase("reveal");
                      setRevealIndex(0);
                      setCanAdvance(true);
                    }}
                  >
                    Ver de nuevo una por una
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
