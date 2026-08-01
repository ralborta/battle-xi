"use client";

import { Button } from "@/components/Button";
import { PACK_COST_GEMS, PACK_SIZE } from "@/lib/futbol5";
import { Gem, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Pulled = {
  playerName: string;
  position: string;
  rarity: string;
  rating: number;
  countryFlag: string;
};

export function AbrirSobre({ gems }: { gems: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulled, setPulled] = useState<Pulled[] | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/pack", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo abrir");
        return;
      }
      setPulled(data.cards);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-transparent p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-violet-500/25 border border-violet-400/40 flex items-center justify-center">
          <Package className="w-6 h-6 text-violet-200" />
        </div>
        <div className="flex-1">
          <div className="font-display text-lg text-text-primary">Sobre de 5 fichas</div>
          <div className="text-[11px] text-text-tertiary">
            5 jugadores del catálogo Battle XI
          </div>
        </div>
      </div>

      {pulled && (
        <div className="mt-3 space-y-1 rounded-xl bg-black/20 p-3">
          {pulled.map((c, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {c.countryFlag} {c.playerName}
              </span>
              <span className="text-text-tertiary">
                {c.position} · {c.rating}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <Button
        variant="violet"
        size="md"
        fullWidth
        className="mt-3"
        disabled={busy || gems < PACK_COST_GEMS}
        icon={<Gem className="w-4 h-4" />}
        onClick={() => void open()}
      >
        {busy ? "Abriendo…" : `${PACK_COST_GEMS} gemas · ${PACK_SIZE} fichas`}
      </Button>
    </div>
  );
}
