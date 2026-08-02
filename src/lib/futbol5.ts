import type { Position } from "@/components/PlayerCard";
import type { TeamStyle } from "@/generated/prisma/client";

/** Slots del Fútbol 5: 1 POR, 1 DEF, 2 MC, 1 DEL. */
export const F5_SLOTS = ["POR", "DEF", "MC1", "MC2", "DEL"] as const;
export type F5Slot = (typeof F5_SLOTS)[number];

export function slotPosition(slot: F5Slot): Position {
  if (slot === "MC1" || slot === "MC2") return "MC";
  return slot;
}

export const SLOT_LABELS: Record<F5Slot, string> = {
  POR: "Arquero",
  DEF: "Defensa",
  MC1: "Medio",
  MC2: "Medio",
  DEL: "Delantero",
};

/** Adequación de puesto (doc de producto). */
export function positionFit(
  cardPosition: Position,
  slot: F5Slot,
  compatible: Position[] = [],
): number {
  const needed = slotPosition(slot);
  if (cardPosition === needed) return 1;
  if (compatible.includes(needed)) return 0.93;
  if (cardPosition === "POR" || needed === "POR") return 0.65;
  return 0.8;
}

export type ZoneId = "defensa" | "mediocampo" | "ataque";

export function zoneOfSlot(slot: F5Slot): ZoneId {
  if (slot === "POR" || slot === "DEF") return "defensa";
  if (slot === "DEL") return "ataque";
  return "mediocampo";
}

export interface ZoneStats {
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
}

/** Poder de rol individual (pesos del documento). */
export function rolePower(stats: ZoneStats, position: Position): number {
  if (position === "POR") {
    return 0.55 * stats.def + 0.3 * stats.fis + 0.15 * stats.pas;
  }
  if (position === "DEF") {
    return 0.5 * stats.def + 0.25 * stats.fis + 0.15 * stats.pas + 0.1 * stats.vel;
  }
  if (position === "MC" || position === "DC") {
    return 0.4 * stats.pas + 0.25 * stats.reg + 0.2 * stats.def + 0.15 * stats.fis;
  }
  // DEL / EXT
  return 0.4 * stats.tir + 0.25 * stats.vel + 0.2 * stats.reg + 0.15 * stats.pas;
}

export function zoneRawPower(stats: ZoneStats, zone: ZoneId): number {
  if (zone === "defensa") {
    return 0.5 * stats.def + 0.25 * stats.fis + 0.15 * stats.pas + 0.1 * stats.vel;
  }
  if (zone === "mediocampo") {
    return 0.4 * stats.pas + 0.25 * stats.reg + 0.2 * stats.def + 0.15 * stats.fis;
  }
  return 0.4 * stats.tir + 0.25 * stats.vel + 0.2 * stats.reg + 0.15 * stats.pas;
}

export function styleModifier(style: TeamStyle, zone: ZoneId): number {
  if (style === "equilibrio") return 1;
  if (style === "ataque") {
    if (zone === "ataque") return 1.08;
    if (zone === "defensa") return 0.94;
    return 1;
  }
  // defensa
  if (zone === "defensa") return 1.08;
  if (zone === "ataque") return 0.94;
  return 1;
}

export const ACADEMY_RATING = 55;

export const IMPULSE_START = 100;
export const MOMENTS_TOTAL = 4;

export const MOMENT_LABELS = [
  "Recuperación",
  "Construcción",
  "Definición",
  "Decisivo",
] as const;

/** Slots que componen cada zona. */
export function slotsForZone(zone: ZoneId): F5Slot[] {
  if (zone === "defensa") return ["POR", "DEF"];
  if (zone === "ataque") return ["DEL"];
  return ["MC1", "MC2"];
}

/**
 * Si el rival PRESIONA una zona, pelea contra tu zona de respuesta:
 * - Presiona ataque → su ataque vs tu defensa
 * - Presiona mediocampo → medio vs medio
 * - Presiona defensa (se cierra) → tu ataque vs su defensa
 */
export function responseZone(pressure: ZoneId): ZoneId {
  if (pressure === "ataque") return "defensa";
  if (pressure === "defensa") return "ataque";
  return "mediocampo";
}

export function pressureHelp(pressure: ZoneId): string {
  if (pressure === "ataque") {
    return "El rival ataca. Pelea su ATAQUE contra tu DEFENSA. Reforzá la defensa.";
  }
  if (pressure === "defensa") {
    return "El rival se cierra atrás. Pelea tu ATAQUE contra su DEFENSA. Reforzá el ataque.";
  }
  return "El rival pelea el medio. Mediocampo vs mediocampo. Reforzá el medio.";
}

/** Máximo de intercambios de puestos por turno. */
export const MAX_SWAPS_PER_TURN = 1;

/** Bonus/penalidad táctica al reforzar bien o mal. */
export const TACTIC_CORRECT_BONUS = 0.18;
export const TACTIC_WRONG_PENALTY = 0.08;
export const REINFORCE_ZONE_BOOST = 0.12;

/** Comprime diferencias de poder: la estrategia pesa más que el OVR puro. */
export function softenPower(power: number): number {
  return Math.round(50 + (power - 50) * 0.55);
}

/** @deprecated Usar presión del rival + responseZone. */
export function momentZone(index: number): ZoneId {
  if (index === 0) return "defensa";
  if (index === 1) return "mediocampo";
  if (index === 2) return "ataque";
  return "ataque";
}

/** @deprecated */
export function momentSlots(index: number): F5Slot[] {
  return slotsForZone(momentZone(index));
}

/** XP que gana una carta al ganar su duelo de puesto. */
export const POSITION_WIN_XP = 25;

export type PlayType = "seguro" | "combinado" | "total";

/** Costos pensados para 4 turnos con 100 de impulso (siempre podés cerrar el partido). */
export const PLAY_COST: Record<PlayType, number> = {
  seguro: 10,
  combinado: 20,
  total: 35,
};

export const PLAY_LABELS: Record<PlayType, string> = {
  seguro: "Jugada segura",
  combinado: "Jugada media",
  total: "Jugada arriesgada",
};

/** Texto de riesgo/beneficio para la UI del partido. */
export const PLAY_INFO: Record<
  PlayType,
  {
    cost: number;
    label: string;
    risk: string;
    ifWin: string;
    ifLose: string;
    winMult: number;
    loseMult: number;
  }
> = {
  seguro: {
    cost: 10,
    label: "Jugada segura",
    risk: "Bajo",
    ifWin: "Sumás pocos puntos",
    ifLose: "El rival tampoco suma mucho",
    winMult: 1,
    loseMult: 0.5,
  },
  combinado: {
    cost: 20,
    label: "Jugada media",
    risk: "Medio",
    ifWin: "Sumás puntos normales",
    ifLose: "El rival suma bastante",
    winMult: 1.4,
    loseMult: 1,
  },
  total: {
    cost: 35,
    label: "Jugada arriesgada",
    risk: "Alto",
    ifWin: "Sumás muchos puntos",
    ifLose: "El rival suma mucho si te gana",
    winMult: 2,
    loseMult: 1.5,
  },
};

export const ZONE_LABELS: Record<ZoneId | "arquero" | "equilibrio", string> = {
  ataque: "Ataque",
  mediocampo: "Mediocampo",
  defensa: "Defensa",
  arquero: "Arquero",
  equilibrio: "Equilibrio",
};

export const MOMENT_HELP: Record<number, string> = {
  0: "Recuperación: el rival elige dónde presionar. Leé su jugada y reforzá la zona correcta.",
  1: "Construcción: misma idea — su presión vs tu respuesta. La lectura vale más que el OVR.",
  2: "Definición: si se lanzan al ataque, tu defensa tiene que aguantar.",
  3: "Decisivo: última lectura. Un refuerzo bien puesto puede dar vuelta el partido.",
};

/** Recompensas del partido de equipo (más que el 1v1 básico). */
export const TEAM_REWARDS = {
  win: { gems: 18, xp: 120, trophies: 15 },
  draw: { gems: 8, xp: 70, trophies: 5 },
  loss: { gems: 3, xp: 40, trophies: -5 },
} as const;

export const PACK_COST_GEMS = 75;
export const PACK_SIZE = 5;
export const STARTER_CARD_COUNT = 10;

/** Tope de fichas en el club (fuerza a vender o no abrir sobres). */
export const COLLECTION_MAX = 40;

/** Gemas al vender según rareza. */
export const SELL_GEMS: Record<string, number> = {
  common: 8,
  pro: 15,
  rare: 25,
  elite: 40,
  champion: 65,
  legend: 100,
};

export function sellPriceForRarity(rarity: string): number {
  return SELL_GEMS[rarity] ?? 8;
}

export function clampPower(value: number): number {
  return Math.max(40, Math.min(100, Math.round(value)));
}
