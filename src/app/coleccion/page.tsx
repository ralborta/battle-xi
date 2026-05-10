import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/Button";
import { ScanLine } from "lucide-react";
import Link from "next/link";

const SAMPLE = [
  { name: "Vicente", rating: 89, position: "DEL" as const, rarity: "elite" as const, flag: "🇦🇷", level: 7, stats: { vel: 92, tir: 89, pas: 81, reg: 90, def: 38, fis: 81 } },
  { name: "Martínez", rating: 92, position: "DC" as const, rarity: "champion" as const, flag: "🇨🇴", level: 12, stats: { vel: 93, tir: 91, pas: 85, reg: 90, def: 40, fis: 88 } },
  { name: "Samuel", rating: 86, position: "MC" as const, rarity: "elite" as const, flag: "🇧🇷", level: 5, stats: { vel: 82, tir: 76, pas: 85, reg: 87, def: 70, fis: 79 } },
  { name: "Lucas", rating: 88, position: "DEF" as const, rarity: "pro" as const, flag: "🇪🇸", level: 4, stats: { vel: 85, tir: 55, pas: 71, reg: 74, def: 88, fis: 86 } },
  { name: "Tomás", rating: 79, position: "MC" as const, rarity: "rare" as const, flag: "🇦🇷", level: 3, stats: { vel: 78, tir: 72, pas: 81, reg: 80, def: 65, fis: 75 } },
  { name: "Diego", rating: 74, position: "DEL" as const, rarity: "common" as const, flag: "🇲🇽", level: 1, stats: { vel: 76, tir: 75, pas: 65, reg: 72, def: 30, fis: 70 } },
];

export default function ColeccionPage() {
  return (
    <>
      <PageShell title="Mi Colección" subtitle={`${SAMPLE.length} cartas · 2 listas para mejorar`}>
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

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {["Todas", "Élite", "Pro", "DEL", "MC", "DEF", "POR"].map((f, i) => (
            <button
              key={f}
              className={
                "shrink-0 px-3 h-8 rounded-full text-xs font-display tracking-wider uppercase border transition " +
                (i === 0
                  ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-white/5 border-border-soft text-text-tertiary hover:bg-white/10")
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SAMPLE.map((p) => (
            <div key={p.name} className="flex justify-center">
              <PlayerCard
                name={p.name}
                rating={p.rating}
                position={p.position}
                rarity={p.rarity}
                countryFlag={p.flag}
                level={p.level}
                size="sm"
                stats={p.stats}
              />
            </div>
          ))}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
