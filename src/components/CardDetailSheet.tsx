"use client";

import { Button } from "@/components/Button";
import { PlayerCard, type Position } from "@/components/PlayerCard";
import { F5_SLOTS, type F5Slot, SLOT_LABELS, sellPriceForRarity } from "@/lib/futbol5";
import { RARITY_STYLES, type Rarity } from "@/lib/rarity";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

export type DetailCard = {
  id: string;
  playerName: string;
  position: Position;
  rarity: Rarity;
  rating: number;
  countryFlag: string;
  imageUrl: string | null;
  level: number;
  xp?: number;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
  ability?: string;
  inSquadSlot?: F5Slot | null;
};

type Props = {
  card: DetailCard;
  onClose: () => void;
  /** Permitir vender (colección). */
  canSell?: boolean;
  onSold?: (gemsEarned: number) => void;
  /** Asignar a un puesto del Fútbol 5. */
  canAssign?: boolean;
  onAssigned?: () => void;
};

export function CardDetailSheet({
  card,
  onClose,
  canSell = false,
  onSold,
  canAssign = false,
  onAssigned,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingSlot, setPickingSlot] = useState(false);
  const style = RARITY_STYLES[card.rarity];
  const sellPrice = sellPriceForRarity(card.rarity);

  const sell = async () => {
    if (!confirm(`¿Vender a ${card.playerName} por ${sellPrice} gemas?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${card.id}/sell`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo vender");
        return;
      }
      onSold?.(data.gemsEarned as number);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const assign = async (slot: F5Slot) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/squad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: { [slot]: card.id } }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo poner en el equipo");
        return;
      }
      onAssigned?.();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/15 bg-bg-deep p-4 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              className="text-[11px] font-display tracking-widest uppercase"
              style={{ color: style.color }}
            >
              {style.label}
            </p>
            <h2 className="font-display text-xl text-text-primary">{card.playerName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <PlayerCard
            name={card.playerName}
            rating={card.rating}
            position={card.position}
            rarity={card.rarity}
            countryFlag={card.countryFlag}
            level={card.level}
            imageUrl={card.imageUrl ?? undefined}
            size="md"
            stats={{
              vel: card.vel,
              tir: card.tir,
              pas: card.pas,
              reg: card.reg,
              def: card.def,
              fis: card.fis,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {(
            [
              ["VEL", card.vel],
              ["TIR", card.tir],
              ["PAS", card.pas],
              ["REG", card.reg],
              ["DEF", card.def],
              ["FÍS", card.fis],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center"
            >
              <div className="text-[10px] text-text-tertiary">{label}</div>
              <div className="font-display text-lg text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-tertiary mb-4 text-center">
          Nivel {card.level}
          {typeof card.xp === "number" ? ` · ${card.xp} XP` : ""}
          {card.inSquadSlot
            ? ` · En equipo: ${SLOT_LABELS[card.inSquadSlot]}`
            : ""}
        </p>

        {error && <p className="mb-3 text-sm text-red-400 text-center">{error}</p>}

        {pickingSlot ? (
          <div className="space-y-2">
            <p className="text-xs text-text-tertiary text-center mb-2">
              Elegí el puesto
            </p>
            {F5_SLOTS.map((slot) => (
              <Button
                key={slot}
                variant="ghost"
                size="md"
                fullWidth
                disabled={busy}
                onClick={() => void assign(slot)}
              >
                {SLOT_LABELS[slot]} ({slot})
              </Button>
            ))}
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setPickingSlot(false)}
            >
              Volver
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {canAssign && (
              <Button
                variant="cyan"
                size="md"
                fullWidth
                disabled={busy}
                onClick={() => setPickingSlot(true)}
              >
                Poner en el equipo
              </Button>
            )}
            {canSell && (
              <Button
                variant="violet"
                size="md"
                fullWidth
                disabled={busy || Boolean(card.inSquadSlot)}
                onClick={() => void sell()}
              >
                {card.inSquadSlot
                  ? "Sacála del equipo para vender"
                  : `Vender · ${sellPrice} gemas`}
              </Button>
            )}
            <Button variant="ghost" size="md" fullWidth onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Wrapper clickable opcional. */
export function CardTapTarget({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("text-left", className)}>
      {children}
    </button>
  );
}
