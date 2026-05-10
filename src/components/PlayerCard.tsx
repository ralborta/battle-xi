"use client";

import { cn } from "@/lib/cn";
import { RARITY_STYLES, type Rarity } from "@/lib/rarity";

export type Position = "POR" | "DEF" | "MC" | "DC" | "DEL" | "EXT";

export interface PlayerStats {
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
}

export interface PlayerCardProps {
  name: string;
  rating: number;
  position: Position;
  rarity: Rarity;
  countryFlag?: string;
  stats: PlayerStats;
  imageUrl?: string;
  level?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  rotate?: number;
}

const SIZES = {
  sm: { card: "w-[160px] h-[224px]", rating: "text-[40px]", name: "text-sm", stat: "text-[10px]" },
  md: { card: "w-[220px] h-[308px]", rating: "text-[56px]", name: "text-base", stat: "text-[11px]" },
  lg: { card: "w-[280px] h-[392px]", rating: "text-[72px]", name: "text-lg", stat: "text-xs" },
};

export function PlayerCard({
  name,
  rating,
  position,
  rarity,
  countryFlag = "🇦🇷",
  stats,
  imageUrl,
  level,
  size = "md",
  className,
  rotate = 0,
}: PlayerCardProps) {
  const style = RARITY_STYLES[rarity];
  const sizes = SIZES[size];

  const statRows: Array<[string, number]> = [
    ["VEL", stats.vel],
    ["TIR", stats.tir],
    ["PAS", stats.pas],
    ["REG", stats.reg],
    ["DEF", stats.def],
    ["FÍS", stats.fis],
  ];

  return (
    <div
      className={cn("relative drop-card", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div
        className={cn("relative rounded-[22px] overflow-hidden", sizes.card)}
        style={{
          background: style.bgGradient,
          boxShadow: `
            0 0 0 2px ${style.borderFrom},
            0 0 24px ${style.glow},
            0 0 60px ${style.glow},
            0 30px 60px rgba(0,0,0,0.55)
          `,
        }}
      >
        {/* Brillo diagonal */}
        <div
          className="absolute inset-0 rounded-[22px] pointer-events-none opacity-30"
          style={{
            background:
              "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
          }}
        />

        {/* Patrón interno */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.4) 0, transparent 50%)",
          }}
        />

        {/* Header: rating + posición + bandera */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <div className="flex flex-col leading-none">
            <span
              className={cn("font-display tracking-tight", sizes.rating)}
              style={{
                color: style.color,
                textShadow: style.textShadow,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {rating}
            </span>
            <span
              className="font-sport text-white/90 tracking-widest text-sm -mt-1"
              style={{ letterSpacing: "0.15em" }}
            >
              {position}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="text-2xl drop-shadow-md">{countryFlag}</div>
            {level !== undefined && (
              <div
                className="px-2 py-0.5 rounded-md text-[10px] font-bold font-body backdrop-blur-md"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: `1px solid ${style.color}`,
                  color: style.color,
                }}
              >
                LV {level}
              </div>
            )}
          </div>
        </div>

        {/* Imagen del jugador */}
        <div className="absolute inset-x-0 top-0 bottom-[42%] z-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover object-top opacity-95"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">
              ⚽
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.88) 100%)",
            }}
          />
        </div>

        {/* Línea separadora */}
        <div
          className="absolute left-4 right-4 h-[2px] z-10"
          style={{
            top: "58%",
            background: `linear-gradient(90deg, transparent 0%, ${style.color} 50%, transparent 100%)`,
            boxShadow: `0 0 8px ${style.glow}`,
          }}
        />

        {/* Nombre */}
        <div className="absolute left-0 right-0 z-10" style={{ top: "60%" }}>
          <div className="text-center px-3">
            <div
              className={cn("font-sport tracking-wider truncate", sizes.name)}
              style={{
                color: "#fff",
                letterSpacing: "0.08em",
                textShadow: `0 1px 2px rgba(0,0,0,0.8), 0 0 12px ${style.glow}`,
              }}
            >
              {name.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="absolute left-0 right-0 bottom-3 z-10 px-3">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
            {statRows.map(([label, value]) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between font-mono",
                  sizes.stat,
                )}
              >
                <span
                  className="text-white/60 font-sport tracking-wide"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {label}
                </span>
                <span
                  className="font-bold font-display"
                  style={{
                    color: style.color,
                    textShadow: `0 0 6px ${style.glow}`,
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sello rareza decorativo */}
        <div
          className="absolute bottom-[42%] right-3 w-1 h-12 rounded-full z-10"
          style={{
            background: `linear-gradient(180deg, ${style.color}, transparent)`,
            boxShadow: `0 0 8px ${style.glow}`,
          }}
        />
      </div>
    </div>
  );
}
