import { BattleLogo } from "@/components/BattleLogo";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { PlayerCard } from "@/components/PlayerCard";
import { Trophy3D } from "@/components/Trophy3D";
import { Play } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium">
      <div className="absolute inset-0 grid-arena opacity-40 pointer-events-none" />
      <div className="absolute inset-0 particles-overlay pointer-events-none" />

      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120%] h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(34,211,238,0.12) 35%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div
        className="absolute bottom-32 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.4) 50%, transparent 100%)",
          boxShadow: "0 0 24px rgba(34,211,238,0.3)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen pb-32 max-w-md mx-auto w-full">
        <div className="h-6" />

        <section className="relative w-full flex-1 flex flex-col items-center justify-start pt-2 px-3">
          {/* Hero: copa + cartas */}
          <div className="relative w-full h-[560px]">
            {/* Copa central · gigante, en z-10 detrás de cartas */}
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10">
              <Trophy3D size={360} />
            </div>

            {/* Vicente · arriba izquierda */}
            <div
              className="absolute top-0 left-0 z-20"
              style={{ animation: "float 6s ease-in-out infinite", animationDelay: "0s" }}
            >
              <PlayerCard
                name="Vicente"
                rating={89}
                position="DEL"
                rarity="elite"
                countryFlag="🇦🇷"
                size="sm"
                rotate={-12}
                stats={{ vel: 92, tir: 89, pas: 81, reg: 90, def: 38, fis: 81 }}
              />
            </div>

            {/* Martínez · arriba derecha */}
            <div
              className="absolute top-6 right-0 z-20"
              style={{ animation: "float-slow 9s ease-in-out infinite", animationDelay: "0.4s" }}
            >
              <PlayerCard
                name="Martínez"
                rating={92}
                position="DC"
                rarity="elite"
                countryFlag="🇨🇴"
                size="sm"
                rotate={12}
                stats={{ vel: 93, tir: 91, pas: 85, reg: 90, def: 40, fis: 88 }}
              />
            </div>

            {/* Samuel · abajo izquierda */}
            <div
              className="absolute bottom-0 left-0 z-30"
              style={{ animation: "float 6s ease-in-out infinite", animationDelay: "1s" }}
            >
              <PlayerCard
                name="Samuel"
                rating={86}
                position="MC"
                rarity="elite"
                countryFlag="🇧🇷"
                size="sm"
                rotate={-14}
                stats={{ vel: 82, tir: 76, pas: 85, reg: 87, def: 70, fis: 79 }}
              />
            </div>

            {/* Lucas · abajo derecha */}
            <div
              className="absolute bottom-0 right-0 z-30"
              style={{ animation: "float-slow 9s ease-in-out infinite", animationDelay: "1.4s" }}
            >
              <PlayerCard
                name="Lucas"
                rating={88}
                position="DEF"
                rarity="pro"
                countryFlag="🇪🇸"
                size="sm"
                rotate={14}
                stats={{ vel: 85, tir: 55, pas: 71, reg: 74, def: 88, fis: 86 }}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="relative mt-2 z-30">
            <BattleLogo size="lg" />
          </div>

          {/* Tagline */}
          <p
            className="mt-5 px-6 text-center font-display tracking-[0.2em] text-[11px] uppercase text-text-secondary max-w-xs"
            style={{ textShadow: "0 0 8px rgba(34,211,238,0.4)" }}
          >
            Coleccioná. Competí. Conquistá la copa.
          </p>

          {/* CTAs */}
          <div className="mt-8 w-full max-w-sm space-y-3">
            <Link href="/jugar" className="block">
              <Button variant="cyan" size="xl" fullWidth icon={<Play className="w-5 h-5 fill-current" />}>
                Jugar
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="ghost" size="md" fullWidth>
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </section>

        <div className="mt-6 px-6 text-center">
          <p className="text-[11px] text-text-muted font-body">
            v0.1 · Tus figuritas cobran vida
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
