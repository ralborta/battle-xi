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

export type PlayType = "seguro" | "combinado" | "total";

export const PLAY_COST: Record<PlayType, number> = {
  seguro: 15,
  combinado: 25,
  total: 40,
};

export const PLAY_LABELS: Record<PlayType, string> = {
  seguro: "Ataque seguro",
  combinado: "Ataque combinado",
  total: "Ataque total",
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

export function clampPower(value: number): number {
  return Math.max(40, Math.min(100, Math.round(value)));
}
