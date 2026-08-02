"use client";

import { Button } from "@/components/Button";
import { CardDetailSheet, type DetailCard } from "@/components/CardDetailSheet";
import { PlayerCard } from "@/components/PlayerCard";
import { COLLECTION_MAX } from "@/lib/futbol5";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ColeccionClient({
  initialCards,
}: {
  initialCards: DetailCard[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [selected, setSelected] = useState<DetailCard | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <div className="mb-4 flex items-center justify-between text-xs text-text-tertiary">
        <span>
          {cards.length}/{COLLECTION_MAX} fichas
        </span>
        <Link href="/equipo" className="text-cyan-300 underline">
          Ir a Mi equipo
        </Link>
      </div>

      <div className="mb-6">
        <Link href="/escanear" className="block">
          <Button
            variant="cyan"
            size="lg"
            fullWidth
            icon={<ScanLine className="w-5 h-5" />}
          >
            Escanear figurita
          </Button>
        </Link>
      </div>

      {toast && (
        <p className="mb-3 text-center text-sm text-amber-200">{toast}</p>
      )}

      {cards.length === 0 ? (
        <div className="rounded-3xl border border-border-soft bg-white/5 px-6 py-10 text-center">
          <ScanLine className="mx-auto h-12 w-12 text-cyan-300/70" />
          <p className="mt-4 font-display text-lg text-text-primary">
            Tu álbum está vacío
          </p>
          <p className="mt-2 text-sm text-text-tertiary font-body">
            Escaneá o abrí un sobre para fichar jugadores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className="flex justify-center"
              onClick={() => setSelected(card)}
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
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Tocá una ficha para ver detalles, ponerla en el equipo o venderla.
      </p>

      {selected && (
        <CardDetailSheet
          card={selected}
          canSell
          canAssign
          onClose={() => setSelected(null)}
          onSold={(gems) => {
            setCards((prev) => prev.filter((c) => c.id !== selected.id));
            setToast(`Vendiste a ${selected.playerName} · +${gems} gemas`);
            router.refresh();
          }}
          onAssigned={() => {
            setToast(`${selected.playerName} entró al equipo`);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
