"use client";

import { Button } from "@/components/Button";
import { PlayerCard } from "@/components/PlayerCard";
import type { Position } from "@/components/PlayerCard";
import type { Rarity } from "@/lib/rarity";
import {
  F5_SLOTS,
  type F5Slot,
  SLOT_LABELS,
  positionFit,
  slotPosition,
} from "@/lib/futbol5";
import { cn } from "@/lib/cn";
import { Shuffle, Swords, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type CardDTO = {
  id: string;
  playerName: string;
  position: Position;
  rarity: Rarity;
  rating: number;
  countryFlag: string;
  imageUrl: string | null;
  level: number;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
  ability: string;
};

type SlotDTO = { slotKey: string; cardId: string | null; card: CardDTO | null };

type SquadDTO = {
  id: string;
  style: "ataque" | "equilibrio" | "defensa";
  captainSlot: string | null;
  slots: SlotDTO[];
};

export function EquipoClient({
  initialSquad,
  cards,
}: {
  initialSquad: SquadDTO;
  cards: CardDTO[];
}) {
  const router = useRouter();
  const [squad, setSquad] = useState(initialSquad);
  const [selectedSlot, setSelectedSlot] = useState<F5Slot | null>(null);
  const [pending, startTransition] = useTransition();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bySlot = useMemo(() => {
    const map = new Map<string, CardDTO | null>();
    for (const s of squad.slots) map.set(s.slotKey, s.card);
    return map;
  }, [squad]);

  const usedIds = new Set(
    squad.slots.map((s) => s.cardId).filter(Boolean) as string[],
  );

  const saveSlots = async (slots: Partial<Record<F5Slot, string | null>>) => {
    setError(null);
    const res = await fetch("/api/squad", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots, style: squad.style }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo guardar");
      return;
    }
    setSquad(data.squad);
    startTransition(() => router.refresh());
  };

  const autoFill = async () => {
    setError(null);
    const res = await fetch("/api/squad/auto", { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo armar");
      return;
    }
    setSquad(data.squad);
    setSelectedSlot(null);
  };

  const startMatch = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/team-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: squad.style }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo empezar");
        return;
      }
      router.push(`/equipo/partido/${data.match.id}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["ataque", "equilibrio", "defensa"] as const).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => {
              setSquad((s) => ({ ...s, style }));
              void saveSlots({});
              void fetch("/api/squad", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slots: {}, style }),
              }).then(async (res) => {
                const data = await res.json();
                if (res.ok) setSquad(data.squad);
              });
            }}
            className={cn(
              "flex-1 h-10 rounded-xl text-xs font-display tracking-wider uppercase border transition",
              squad.style === style
                ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-100"
                : "bg-white/5 border-border-soft text-text-tertiary",
            )}
          >
            {style}
          </button>
        ))}
      </div>

      <div className="relative rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-emerald-950/40 to-bg-deep p-4 min-h-[340px]">
        <div className="absolute inset-3 border border-white/10 rounded-2xl pointer-events-none" />
        <div className="relative grid grid-rows-4 gap-3 h-full py-2">
          <SlotButton
            slot="DEL"
            card={bySlot.get("DEL") ?? null}
            active={selectedSlot === "DEL"}
            onClick={() => setSelectedSlot("DEL")}
          />
          <div className="grid grid-cols-2 gap-3">
            <SlotButton
              slot="MC1"
              card={bySlot.get("MC1") ?? null}
              active={selectedSlot === "MC1"}
              onClick={() => setSelectedSlot("MC1")}
            />
            <SlotButton
              slot="MC2"
              card={bySlot.get("MC2") ?? null}
              active={selectedSlot === "MC2"}
              onClick={() => setSelectedSlot("MC2")}
            />
          </div>
          <SlotButton
            slot="DEF"
            card={bySlot.get("DEF") ?? null}
            active={selectedSlot === "DEF"}
            onClick={() => setSelectedSlot("DEF")}
          />
          <SlotButton
            slot="POR"
            card={bySlot.get("POR") ?? null}
            active={selectedSlot === "POR"}
            onClick={() => setSelectedSlot("POR")}
          />
        </div>
      </div>

      {selectedSlot && (
        <div className="rounded-2xl border border-border-soft bg-white/5 p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-sm text-text-secondary">
              Elegí para {SLOT_LABELS[selectedSlot]}
            </p>
            <button
              type="button"
              className="text-xs text-text-tertiary underline"
              onClick={() => {
                void saveSlots({ [selectedSlot]: null });
                setSelectedSlot(null);
              }}
            >
              Dejar Academia
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cards.map((card) => {
              const taken = usedIds.has(card.id) && bySlot.get(selectedSlot)?.id !== card.id;
              const fit = positionFit(card.position, selectedSlot);
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={taken || pending}
                  onClick={() => {
                    void saveSlots({ [selectedSlot]: card.id });
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "shrink-0 opacity-100 disabled:opacity-30",
                    fit < 0.93 && "outline outline-1 outline-amber-400/50 rounded-xl",
                  )}
                >
                  <PlayerCard
                    name={card.playerName}
                    rating={card.rating}
                    position={card.position}
                    rarity={card.rarity}
                    countryFlag={card.countryFlag}
                    level={card.level}
                    imageUrl={card.imageUrl ?? undefined}
                    size="sm"
                    stats={{
                      vel: card.vel,
                      tir: card.tir,
                      pas: card.pas,
                      reg: card.reg,
                      def: card.def,
                      fis: card.fis,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="ghost"
          size="md"
          fullWidth
          icon={<Shuffle className="w-4 h-4" />}
          onClick={() => void autoFill()}
          disabled={pending}
        >
          Mejor equipo
        </Button>
        <Button
          variant="cyan"
          size="md"
          fullWidth
          icon={<Swords className="w-4 h-4" />}
          onClick={() => void startMatch()}
          disabled={starting}
        >
          {starting ? "Buscando…" : "Jugar partido"}
        </Button>
      </div>

      <p className="text-center text-[11px] text-text-muted font-body">
        Fútbol 5 · Por ahora solo sumás puntos. Torneos más adelante.
      </p>
    </div>
  );
}

function SlotButton({
  slot,
  card,
  active,
  onClick,
}: {
  slot: F5Slot;
  card: CardDTO | null;
  active: boolean;
  onClick: () => void;
}) {
  const academy = !card;
  const fit = card ? positionFit(card.position, slot) : 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mx-auto w-full max-w-[200px] rounded-2xl border px-3 py-3 text-left transition",
        active
          ? "border-cyan-400/60 bg-cyan-400/15"
          : "border-white/15 bg-black/25 hover:bg-black/35",
      )}
    >
      <div className="text-[10px] font-display tracking-widest uppercase text-text-tertiary">
        {SLOT_LABELS[slot]} · {slotPosition(slot)}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          {academy ? (
            <UserRound className="w-4 h-4 text-text-muted" />
          ) : (
            <span className="text-sm">{card.countryFlag}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm text-text-primary truncate">
            {academy ? "Academia" : card.playerName}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {academy ? "Carta temporal" : `OVR ${card.rating}`}
            {!academy && fit < 1 ? " · fuera de puesto" : ""}
          </div>
        </div>
      </div>
    </button>
  );
}
