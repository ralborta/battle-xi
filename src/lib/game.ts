import type { PlayerStats, Position } from "@/components/PlayerCard";
import type { Rarity } from "@/lib/rarity";

export type StatKey = keyof PlayerStats;

export const STAT_KEYS: StatKey[] = ["vel", "tir", "pas", "reg", "def", "fis"];

export const STAT_LABELS: Record<StatKey, { short: string; long: string }> = {
  vel: { short: "VEL", long: "Velocidad" },
  tir: { short: "TIR", long: "Tiro" },
  pas: { short: "PAS", long: "Pase" },
  reg: { short: "REG", long: "Regate" },
  def: { short: "DEF", long: "Defensa" },
  fis: { short: "FÍS", long: "Físico" },
};

export function isStatKey(value: string): value is StatKey {
  return (STAT_KEYS as string[]).includes(value);
}

export const ROUNDS_PER_BATTLE = 4;

export const ENERGY_MAX = 20;
export const ENERGY_PER_BATTLE = 2;
export const ENERGY_REGEN_MS = 6 * 60 * 1000;

/** Tope al empuje del nivel para que una carta vieja no vuelva imposible el duelo. */
const MAX_LEVEL_BONUS = 10;
/** Rango del "empuje" aleatorio de cada ronda: le da emoción sin decidir el duelo. */
const MAX_ROUND_PUSH = 6;

export interface Rewards {
  gems: number;
  xp: number;
  trophies: number;
  cardXp: number;
}

export const REWARDS: Record<"win" | "draw" | "loss", Rewards> = {
  win: { gems: 25, xp: 150, trophies: 20, cardXp: 60 },
  draw: { gems: 8, xp: 90, trophies: 5, cardXp: 35 },
  loss: { gems: 0, xp: 40, trophies: -8, cardXp: 20 },
};

export function userLevel(xp: number): number {
  return 1 + Math.floor(xp / 500);
}

export function xpIntoLevel(xp: number): { current: number; needed: number } {
  return { current: xp % 500, needed: 500 };
}

export function cardLevelFromXp(xp: number): number {
  return Math.min(30, 1 + Math.floor(xp / 100));
}

export function levelBonus(level: number): number {
  return Math.min(MAX_LEVEL_BONUS, Math.max(0, level - 1));
}

/**
 * Energía sin tareas programadas: se recalcula a partir del último momento en
 * que la tocamos, así el chico la ve subir aunque no haya nadie mirando.
 */
export function currentEnergy(
  storedEnergy: number,
  updatedAt: Date,
  now: Date = new Date(),
): { energy: number; msToNext: number; anchor: Date } {
  if (storedEnergy >= ENERGY_MAX) return { energy: ENERGY_MAX, msToNext: 0, anchor: now };

  const elapsed = Math.max(0, now.getTime() - updatedAt.getTime());
  const regenerated = Math.floor(elapsed / ENERGY_REGEN_MS);
  const energy = Math.min(ENERGY_MAX, storedEnergy + regenerated);

  if (energy >= ENERGY_MAX) return { energy: ENERGY_MAX, msToNext: 0, anchor: now };

  // El ancla conserva lo avanzado hacia el próximo punto: si al gastar energía
  // reiniciáramos el reloj, jugando seguido nunca se recargaría.
  return {
    energy,
    msToNext: ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS),
    anchor: new Date(updatedAt.getTime() + regenerated * ENERGY_REGEN_MS),
  };
}

/** FNV-1a sobre la semilla del duelo: el mismo duelo siempre da el mismo empuje. */
function hash(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export function roundPush(seed: string, roundIndex: number, side: "user" | "opponent"): number {
  return hash(`${seed}:${roundIndex}:${side}`) % (MAX_ROUND_PUSH + 1);
}

export type RoundWinner = "user" | "opponent" | "tie";

export interface BattleRound {
  stat: StatKey;
  userValue: number;
  opponentValue: number;
  userPush: number;
  opponentPush: number;
  winner: RoundWinner;
}

export function resolveRound(args: {
  seed: string;
  roundIndex: number;
  stat: StatKey;
  userStat: number;
  userLevel: number;
  opponentStat: number;
  opponentLevel: number;
}): BattleRound {
  const userPush = roundPush(args.seed, args.roundIndex, "user");
  const opponentPush = roundPush(args.seed, args.roundIndex, "opponent");

  const userValue = args.userStat + levelBonus(args.userLevel) + userPush;
  const opponentValue = args.opponentStat + levelBonus(args.opponentLevel) + opponentPush;

  const winner: RoundWinner =
    userValue > opponentValue ? "user" : opponentValue > userValue ? "opponent" : "tie";

  return { stat: args.stat, userValue, opponentValue, userPush, opponentPush, winner };
}

export type BattleResultKind = "win" | "loss" | "draw";

export function battleResult(scoreUser: number, scoreOpponent: number): BattleResultKind {
  if (scoreUser > scoreOpponent) return "win";
  if (scoreOpponent > scoreUser) return "loss";
  return "draw";
}

/**
 * Lo que ve el navegador. Las stats del rival no viajan: solo se conoce el
 * número con el que respondió en las rondas ya jugadas.
 */
export interface BattleView {
  id: string;
  status: "active" | "finished";
  result: BattleResultKind | null;
  scoreUser: number;
  scoreOpponent: number;
  roundIndex: number;
  roundsTotal: number;
  rounds: BattleRound[];
  usedStats: StatKey[];
  you: {
    name: string;
    rating: number;
    position: Position;
    rarity: Rarity;
    flag: string;
    level: number;
    levelBonus: number;
    imageUrl: string | null;
    stats: PlayerStats;
  };
  opponent: {
    nickname: string;
    name: string;
    rating: number;
    position: Position;
    rarity: Rarity;
    flag: string;
    level: number;
    imageUrl: string | null;
    isBot: boolean;
  };
  rewards: { gems: number; xp: number; trophies: number } | null;
}
