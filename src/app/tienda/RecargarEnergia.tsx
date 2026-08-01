"use client";

import { Gem, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  gems: number;
  energy: number;
  max: number;
  cost: number;
}

export function RecargarEnergia({ gems, energy, max, cost }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = energy >= max;
  const affordable = gems >= cost;
  const busy = buying || pending;

  const buy = async () => {
    setError(null);
    setBuying(true);
    try {
      const res = await fetch("/api/shop/energy-refill", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "No pudimos completar la compra");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y reintentá.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/12 to-amber-700/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40">
          <Zap className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="font-display text-base text-text-primary leading-tight">
            Energía llena
          </div>
          <div className="text-[11px] text-text-tertiary">
            Tenés {energy} de {max}. La recarga te deja el tanque al tope.
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400 font-body">{error}</p>}

      <button
        type="button"
        onClick={() => void buy()}
        disabled={full || !affordable || busy}
        className="mt-3 w-full h-11 rounded-xl font-display tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:active:scale-100 bg-amber-400/20 border border-amber-400/50 text-amber-100 hover:bg-amber-400/30 disabled:bg-white/5 disabled:border-border-soft disabled:text-text-muted"
      >
        {full ? (
          "Tanque lleno"
        ) : busy ? (
          "Recargando…"
        ) : (
          <>
            <Gem className="w-4 h-4" />
            {cost} gemas
          </>
        )}
      </button>

      {!full && !affordable && (
        <p className="mt-2 text-center text-[11px] text-text-muted font-body">
          Te faltan {cost - gems} gemas. Jugá un duelo para juntarlas.
        </p>
      )}
    </div>
  );
}
