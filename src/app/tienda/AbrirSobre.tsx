"use client";

import { Button } from "@/components/Button";
import { PACK_ART } from "@/lib/catalog-data";
import { PACK_COST_GEMS, PACK_SIZE } from "@/lib/futbol5";
import { Gem } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Pulled = {
  playerName: string;
  position: string;
  rarity: string;
  rating: number;
  countryFlag: string;
  imageUrl: string | null;
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

      {pulled && (
        <div className="mt-4 space-y-2 rounded-xl bg-black/25 p-3">
          <p className="text-[11px] font-display tracking-widest uppercase text-cyan-200/80">
            Salieron
          </p>
          {pulled.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {c.imageUrl && (
                <span className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 border border-white/10">
                  <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="32px" />
                </span>
              )}
              <span className="flex-1 truncate">
                {c.countryFlag} {c.playerName}
              </span>
              <span className="text-text-tertiary text-[11px]">
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
        className="mt-4"
        disabled={busy || gems < PACK_COST_GEMS}
        icon={<Gem className="w-4 h-4" />}
        onClick={() => void open()}
      >
        {busy ? "Abriendo…" : `${PACK_COST_GEMS} gemas · abrir sobre`}
      </Button>
    </div>
  );
}
