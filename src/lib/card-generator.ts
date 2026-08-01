import type { Position } from "@/components/PlayerCard";
import type { Rarity } from "@/lib/rarity";

export const POSITIONS: Position[] = ["POR", "DEF", "MC", "DC", "DEL", "EXT"];

export function isPosition(value: string): value is Position {
  return (POSITIONS as string[]).includes(value);
}

export interface GeneratedCard {
  rarity: Rarity;
  rating: number;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
}

const RARITY_ODDS: Array<{ rarity: Rarity; weight: number; min: number; max: number }> = [
  { rarity: "common", weight: 40, min: 58, max: 69 },
  { rarity: "pro", weight: 25, min: 68, max: 76 },
  { rarity: "rare", weight: 18, min: 74, max: 82 },
  { rarity: "elite", weight: 10, min: 80, max: 88 },
  { rarity: "champion", weight: 6, min: 86, max: 92 },
  { rarity: "legend", weight: 1, min: 90, max: 96 },
];

type StatKey = "vel" | "tir" | "pas" | "reg" | "def" | "fis";

/** Cuánto se aparta cada stat del rating general según el puesto. */
const POSITION_PROFILE: Record<Position, Record<StatKey, number>> = {
  POR: { vel: -22, tir: -38, pas: -12, reg: -26, def: 6, fis: 4 },
  DEF: { vel: -3, tir: -20, pas: -6, reg: -10, def: 9, fis: 7 },
  MC: { vel: -1, tir: -3, pas: 8, reg: 5, def: -4, fis: -2 },
  DC: { vel: 3, tir: 9, pas: -8, reg: 2, def: -28, fis: 4 },
  DEL: { vel: 8, tir: 8, pas: -6, reg: 4, def: -27, fis: -1 },
  EXT: { vel: 11, tir: 2, pas: -2, reg: 9, def: -25, fis: -6 },
};

/** FNV-1a: alcanza para sembrar el generador y es estable entre ejecuciones. */
function seedFrom(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min = 32, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function rarityForRating(rating: number): Rarity {
  const band = RARITY_ODDS.find((o) => rating >= o.min && rating <= o.max);
  return band?.rarity ?? "common";
}

/**
 * Genera la carta a partir de una semilla estable: el mismo escaneo siempre
 * produce los mismos números, así un reintento no cambia lo que ya vio el chico.
 *
 * Con `targetRating` el rating viene impuesto (lo usa el rival del sistema para
 * salir parejo con la carta del chico) y la rareza se deduce de ese número.
 */
export function generateCard(
  seedInput: string,
  position: Position,
  targetRating?: number,
): GeneratedCard {
  const random = mulberry32(seedFrom(seedInput));

  const totalWeight = RARITY_ODDS.reduce((sum, o) => sum + o.weight, 0);
  let roll = random() * totalWeight;
  let odds = RARITY_ODDS[0];
  for (const option of RARITY_ODDS) {
    roll -= option.weight;
    if (roll <= 0) {
      odds = option;
      break;
    }
  }

  const rating =
    targetRating === undefined
      ? Math.round(odds.min + random() * (odds.max - odds.min))
      : clamp(targetRating, 55, 96);
  const rarity = targetRating === undefined ? odds.rarity : rarityForRating(rating);
  const profile = POSITION_PROFILE[position];

  const stat = (key: StatKey): number =>
    clamp(rating + profile[key] + (random() * 8 - 4));

  return {
    rarity,
    rating,
    vel: stat("vel"),
    tir: stat("tir"),
    pas: stat("pas"),
    reg: stat("reg"),
    def: stat("def"),
    fis: stat("fis"),
  };
}
