"use client";

import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { PlayerCard } from "@/components/PlayerCard";
import { getLocalProfile } from "@/lib/onboarding-storage";
import { ScanLine, Swords, Gem, Zap, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function JugarContent() {
  const [hello, setHello] = useState("Hola, Capitán");

  useEffect(() => {
    const p = getLocalProfile();
    if (p?.nickname) {
      setHello(`Hola, ${p.nickname}`);
    }
  }, []);

  return (
    <>
      <PageShell title={hello} subtitle="Nivel 8 · 1980 trofeos">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/5 p-3">
            <div className="flex items-center gap-2 text-[11px] font-display tracking-widest uppercase text-text-tertiary">
              <Gem className="w-3.5 h-3.5 text-cyan-300" />
              Gemas
            </div>
            <div
              className="mt-1 font-display text-3xl text-cyan-200"
              style={{ textShadow: "0 0 12px rgba(34,211,238,0.55)" }}
            >
              340
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-amber-700/5 p-3">
            <div className="flex items-center gap-2 text-[11px] font-display tracking-widest uppercase text-text-tertiary">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Energía
            </div>
            <div
              className="mt-1 font-display text-3xl text-amber-300"
              style={{ textShadow: "0 0 12px rgba(251,191,36,0.55)" }}
            >
              18<span className="text-base text-amber-300/50">/20</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-transparent p-5 mb-5">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-200 text-[11px] font-display tracking-widest uppercase">
              <ScanLine className="w-4 h-4" />
              Acción principal
            </div>
            <p className="mt-2 font-display text-2xl text-text-primary leading-tight">
              Escaneá tu próxima figurita
            </p>
            <p className="mt-1 text-sm text-text-tertiary">
              Tu figurita se transforma en una carta exclusiva.
            </p>
            <Link href="/escanear" className="block mt-4">
              <Button variant="cyan" size="lg" fullWidth icon={<ScanLine className="w-5 h-5" />}>
                Escanear ahora
              </Button>
            </Link>
          </div>
        </div>

        <h2 className="font-display text-lg tracking-wide text-text-secondary mb-3">
          Tu capitán
        </h2>
        <div className="flex justify-center mb-6">
          <PlayerCard
            name="Martínez"
            rating={92}
            position="DC"
            rarity="champion"
            countryFlag="🇨🇴"
            level={12}
            size="md"
            stats={{ vel: 93, tir: 91, pas: 85, reg: 90, def: 40, fis: 88 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/batallas">
            <Button variant="violet" size="md" fullWidth icon={<Swords className="w-4 h-4" />}>
              Batalla
            </Button>
          </Link>
          <Link href="/torneos">
            <Button variant="gold" size="md" fullWidth icon={<Trophy className="w-4 h-4" />}>
              Torneo
            </Button>
          </Link>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
