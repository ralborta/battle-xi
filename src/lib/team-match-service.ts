import "server-only";

import { randomUUID } from "node:crypto";
import type {
  Card,
  PlayerTemplate,
  Prisma,
  TeamMatch,
  TeamStyle,
  User,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  ACADEMY_RATING,
  F5_SLOTS,
  type F5Slot,
  IMPULSE_START,
  MOMENTS_TOTAL,
  MOMENT_LABELS,
  PLAY_COST,
  type PlayType,
  TEAM_REWARDS,
  clampPower,
  positionFit,
  rolePower,
  slotPosition,
  styleModifier,
  zoneOfSlot,
  type ZoneId,
  zoneRawPower,
} from "@/lib/futbol5";
import { getOrCreateFutbol5Squad } from "@/lib/squad-service";
import { ensureCatalogSeeded } from "@/lib/catalog";

export class TeamGameError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface LineupPlayer {
  slot: F5Slot;
  cardId: string | null;
  name: string;
  position: string;
  rarity: string;
  rating: number;
  flag: string;
  imageUrl: string | null;
  ability: string;
  isAcademy: boolean;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
  compatible: string[];
}

export interface MomentLog {
  index: number;
  label: string;
  playType: PlayType;
  impulseSpent: number;
  zone: ZoneId;
  userPower: number;
  botPower: number;
  userPoints: number;
  botPoints: number;
  winner: "user" | "bot" | "tie";
  hint: string;
}

function readCompatible(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function academyPlayer(slot: F5Slot): LineupPlayer {
  const position = slotPosition(slot);
  const base = ACADEMY_RATING;
  return {
    slot,
    cardId: null,
    name: "Academia",
    position,
    rarity: "common",
    rating: base,
    flag: "⚪",
    imageUrl: "/avatars/player-default.svg",
    ability: "none",
    isAcademy: true,
    vel: base - 4,
    tir: position === "DEL" || position === "EXT" ? base : base - 12,
    pas: position === "MC" ? base + 2 : base - 6,
    reg: base - 6,
    def: position === "POR" || position === "DEF" ? base + 4 : base - 14,
    fis: base,
    compatible: [],
  };
}

function fromCard(slot: F5Slot, card: Card & { template?: PlayerTemplate | null }): LineupPlayer {
  return {
    slot,
    cardId: card.id,
    name: card.playerName,
    position: card.position,
    rarity: card.rarity,
    rating: card.rating,
    flag: card.countryFlag,
    imageUrl: card.imageUrl,
    ability: card.ability,
    isAcademy: false,
    vel: card.vel,
    tir: card.tir,
    pas: card.pas,
    reg: card.reg,
    def: card.def,
    fis: card.fis,
    compatible: readCompatible(card.template?.compatible),
  };
}

function connectionBonus(lineup: LineupPlayer[]): number {
  let bonus = 0;
  const filled = lineup.filter((p) => !p.isAcademy);
  if (filled.length === 5) bonus += 1;
  const allFit = lineup.every((p) => {
    const fit = positionFit(p.position as never, p.slot, p.compatible as never[]);
    return fit >= 0.93;
  });
  if (allFit) bonus += 2;
  const weak = lineup.some((p) => p.rating < 60 && p.isAcademy);
  if (!weak) bonus += 1;
  return Math.min(5, bonus);
}

function zonePower(lineup: LineupPlayer[], zone: ZoneId, style: TeamStyle): number {
  const members = lineup.filter((p) => zoneOfSlot(p.slot) === zone);
  if (members.length === 0) return 40;

  const values = members.map((p) => {
    const fit = positionFit(p.position as never, p.slot, p.compatible as never[]);
    const individual = rolePower(p, p.position as never);
    const zonal = zoneRawPower(p, zone);
    return ((individual + zonal) / 2) * fit;
  });

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const conn = 1 + connectionBonus(lineup) / 100;
  return clampPower(avg * conn * styleModifier(style, zone));
}

function momentZone(index: number): ZoneId {
  if (index === 0 || index === 1) return "mediocampo";
  if (index === 2) return "ataque";
  return "ataque";
}

function playMultiplier(play: PlayType): { win: number; lose: number } {
  if (play === "seguro") return { win: 1, lose: 0.5 };
  if (play === "combinado") return { win: 1.4, lose: 1 };
  return { win: 2, lose: 1.5 };
}

function hash(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

function push(seed: string, moment: number, side: string): number {
  return (hash(`${seed}:${moment}:${side}`) % 7) - 3;
}

async function buildUserLineup(userId: string): Promise<LineupPlayer[]> {
  const squad = await getOrCreateFutbol5Squad(userId);
  const bySlot = new Map(squad.slots.map((s) => [s.slotKey, s.card]));

  // cargar templates para compatible
  const cardIds = squad.slots.map((s) => s.cardId).filter(Boolean) as string[];
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    include: { template: true },
  });
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return F5_SLOTS.map((slot) => {
    const raw = bySlot.get(slot);
    if (!raw) return academyPlayer(slot);
    const full = cardMap.get(raw.id);
    return full ? fromCard(slot, full) : academyPlayer(slot);
  });
}

async function buildBotLineup(): Promise<LineupPlayer[]> {
  await ensureCatalogSeeded();
  const templates = await prisma.playerTemplate.findMany({ where: { published: true } });
  const pick = (positions: string[]) => {
    const pool = templates.filter((t) => positions.includes(t.position));
    return pool[Math.floor(Math.random() * pool.length)] ?? templates[0];
  };

  return F5_SLOTS.map((slot) => {
    const needed = slotPosition(slot);
    const t = pick(
      needed === "DEL"
        ? ["DEL", "EXT"]
        : needed === "MC"
          ? ["MC", "DC"]
          : [needed],
    );
    return {
      slot,
      cardId: null,
      name: t.playerName,
      position: t.position,
      rarity: t.rarity,
      rating: t.rating,
      flag: t.countryFlag,
      imageUrl: t.imageUrl,
      ability: t.ability,
      isAcademy: false,
      vel: t.vel,
      tir: t.tir,
      pas: t.pas,
      reg: t.reg,
      def: t.def,
      fis: t.fis,
      compatible: readCompatible(t.compatible),
    };
  });
}

export async function startTeamMatch(user: User, style?: TeamStyle) {
  const active = await prisma.teamMatch.findFirst({
    where: { userId: user.id, status: "active" },
  });
  if (active) return { match: active, created: false };

  const squad = await getOrCreateFutbol5Squad(user.id);
  const lineupUser = await buildUserLineup(user.id);
  const lineupBot = await buildBotLineup();
  const styles: TeamStyle[] = ["ataque", "equilibrio", "defensa"];

  const match = await prisma.teamMatch.create({
    data: {
      userId: user.id,
      styleUser: style ?? squad.style,
      styleBot: styles[Math.floor(Math.random() * styles.length)],
      impulseLeft: IMPULSE_START,
      lineupUser: lineupUser as unknown as Prisma.InputJsonValue,
      lineupBot: lineupBot as unknown as Prisma.InputJsonValue,
      seed: randomUUID(),
    },
  });

  return { match, created: true };
}

function asLineup(raw: unknown): LineupPlayer[] {
  return (raw as LineupPlayer[]) ?? [];
}

function asMoments(raw: unknown): MomentLog[] {
  return (raw as MomentLog[]) ?? [];
}

export async function playTeamMoment(
  user: User,
  matchId: string,
  playType: PlayType,
) {
  if (!PLAY_COST[playType]) {
    throw new TeamGameError("Elegí un tipo de jugada válido", 400);
  }

  const match = await prisma.teamMatch.findFirst({
    where: { id: matchId, userId: user.id },
  });
  if (!match) throw new TeamGameError("No encontramos ese partido", 404);
  if (match.status === "finished") throw new TeamGameError("Este partido ya terminó", 409);

  const cost = PLAY_COST[playType];
  if (match.impulseLeft < cost) {
    throw new TeamGameError("No te alcanza el impulso para esa jugada", 409);
  }

  const lineupUser = asLineup(match.lineupUser);
  const lineupBot = asLineup(match.lineupBot);
  const zone = momentZone(match.momentIndex);
  const userPower =
    zonePower(lineupUser, zone, match.styleUser) +
    push(match.seed, match.momentIndex, "user");
  const botPower =
    zonePower(lineupBot, zone, match.styleBot) +
    push(match.seed, match.momentIndex, "bot");

  const mult = playMultiplier(playType);
  let userPoints = 0;
  let botPoints = 0;
  let winner: MomentLog["winner"] = "tie";

  if (userPower > botPower) {
    winner = "user";
    userPoints = Math.round(cost * mult.win);
  } else if (botPower > userPower) {
    winner = "bot";
    botPoints = Math.round(cost * mult.lose);
  } else {
    userPoints = Math.round(cost * 0.4);
    botPoints = Math.round(cost * 0.4);
  }

  const log: MomentLog = {
    index: match.momentIndex,
    label: MOMENT_LABELS[match.momentIndex],
    playType,
    impulseSpent: cost,
    zone,
    userPower: clampPower(userPower),
    botPower: clampPower(botPower),
    userPoints,
    botPoints,
    winner,
    hint:
      winner === "user"
        ? "Tu zona ganó el choque"
        : winner === "bot"
          ? "El rival se llevó el momento"
          : "Quedaron parejos",
  };

  const moments = [...asMoments(match.moments), log];
  const scoreUser = match.scoreUser + userPoints;
  const scoreOpponent = match.scoreOpponent + botPoints;
  const impulseLeft = match.impulseLeft - cost;
  const nextMoment = match.momentIndex + 1;
  const finished = nextMoment >= MOMENTS_TOTAL;

  if (!finished) {
    return prisma.teamMatch.update({
      where: { id: match.id },
      data: {
        moments: moments as unknown as Prisma.InputJsonValue,
        scoreUser,
        scoreOpponent,
        impulseLeft,
        momentIndex: nextMoment,
      },
    });
  }

  const result =
    scoreUser > scoreOpponent ? "win" : scoreOpponent > scoreUser ? "loss" : "draw";
  const reward = TEAM_REWARDS[result];

  const [updated] = await prisma.$transaction([
    prisma.teamMatch.update({
      where: { id: match.id },
      data: {
        moments: moments as unknown as Prisma.InputJsonValue,
        scoreUser,
        scoreOpponent,
        impulseLeft,
        momentIndex: nextMoment,
        status: "finished",
        result,
        finishedAt: new Date(),
        gemsEarned: reward.gems,
        xpEarned: reward.xp,
        trophiesDelta: reward.trophies,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        gems: { increment: reward.gems },
        xp: { increment: reward.xp },
        trophies: Math.max(0, user.trophies + reward.trophies),
        wins: result === "win" ? { increment: 1 } : undefined,
        losses: result === "loss" ? { increment: 1 } : undefined,
        draws: result === "draw" ? { increment: 1 } : undefined,
        streak: result === "win" ? { increment: 1 } : result === "loss" ? 0 : undefined,
      },
    }),
  ]);

  return updated;
}

export function toTeamMatchView(match: TeamMatch) {
  const lineupUser = asLineup(match.lineupUser);
  const lineupBot = asLineup(match.lineupBot);
  const moments = asMoments(match.moments);

  // Info parcial del rival: rango de poder por zona, sin números exactos.
  const zones = (["defensa", "mediocampo", "ataque"] as ZoneId[]).map((zone) => {
    const power = zonePower(lineupBot, zone, match.styleBot);
    return {
      zone,
      range: [Math.max(40, power - 4), Math.min(100, power + 4)] as [number, number],
      cards: lineupBot
        .filter((p) => zoneOfSlot(p.slot) === zone)
        .map((p) => ({
          name: p.name,
          position: p.position,
          rarity: p.rarity,
          flag: p.flag,
          imageUrl: p.imageUrl,
        })),
    };
  });

  return {
    id: match.id,
    status: match.status,
    result: match.result,
    styleUser: match.styleUser,
    styleBot: match.styleBot,
    impulseLeft: match.impulseLeft,
    scoreUser: match.scoreUser,
    scoreOpponent: match.scoreOpponent,
    momentIndex: match.momentIndex,
    momentsTotal: MOMENTS_TOTAL,
    momentLabel: MOMENT_LABELS[Math.min(match.momentIndex, MOMENTS_TOTAL - 1)],
    moments,
    you: lineupUser,
    rivalZones: zones,
    rewards:
      match.status === "finished"
        ? {
            gems: match.gemsEarned,
            xp: match.xpEarned,
            trophies: match.trophiesDelta,
          }
        : null,
  };
}
