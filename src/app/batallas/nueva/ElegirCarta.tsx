"use client";

import { Button } from "@/components/Button";
import { PlayerCard, type PlayerStats, type Position } from "@/components/PlayerCard";
import { cn } from "@/lib/cn";
import type { Rarity } from "@/lib/rarity";
import { Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface PickableCard {
  id: string;
  name: string;
  rating: number;
  position: Position;
  rarity: Rarity;
  flag: string;
  level: number;
  imageUrl: string | null;
  stats: PlayerStats;
}

export function ElegirCarta({
  cards,
  hasEnergy,
}: {
  cards: PickableCard[];
  hasEnergy: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(cards[0]?.id ?? "");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: selected }),
      });
      const data = (await res.json().catch(() => null)) as
        | { battle?: { id: string }; error?: string }
        | null;

      if (!res.ok || !data?.battle) {
        setError(data?.error ?? "No pudimos empezar el duelo. Probá de nuevo.");
        return;
      }
      router.push(`/batallas/${data.battle.id}`);
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y reintentá.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-text-tertiary font-body">
        Vas a jugar cuatro rondas. En cada una elegís una habilidad y se compara
        con la del rival, que no vas a ver hasta jugarla.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelected(card.id)}
            className={cn(
              "flex justify-center rounded-3xl p-1 transition",
              card.id === selected
                ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-bg-void"
                : "opacity-70 hover:opacity-100",
            )}
          >
            <PlayerCard
              name={card.name}
              rating={card.rating}
              position={card.position}
              rarity={card.rarity}
              countryFlag={card.flag}
              level={card.level}
              imageUrl={card.imageUrl ?? undefined}
              size="sm"
              stats={card.stats}
            />
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-center text-sm text-red-400 font-body">{error}</p>}

      {!hasEnergy && (
        <p className="mb-4 text-center text-sm text-amber-300 font-body">
          Te quedaste sin energía. Se recarga sola, volvé en un rato.
        </p>
      )}

      <Button
        variant="cyan"
        size="xl"
        fullWidth
        icon={<Swords className="w-5 h-5" />}
        disabled={!selected || starting || !hasEnergy}
        onClick={() => void start()}
      >
        {starting ? "Buscando rival…" : "Salir a la cancha"}
      </Button>
    </div>
  );
}
