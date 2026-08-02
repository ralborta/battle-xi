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
  F5_SLOTS,
  type F5Slot,
  IMPULSE_START,
  MOMENTS_TOTAL,
  MOMENT_LABELS,
  PLAY_COST,
  type PlayType,
  POSITION_WIN_XP,
  TEAM_REWARDS,
  clampPower,
  momentSlots,
  momentZone,
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

export interface SlotDuel {
  slot: F5Slot;
  userName: string;
  botName: string;
  userPower: number;
  botPower: number;
  userPoints: number;
  botPoints: number;
  winner: "user" | "bot" | "tie";
  userCardId: string | null;
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
  duels: SlotDuel[];
}

function readCompatible(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
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

/** Bonus de conexión: puestos correctos + plantel completo + sin flancos flojos. */
export function connectionBonus(lineup: LineupPlayer[]): number {
  let bonus = 0;
  const filled = lineup.filter((p) => !p.isAcademy);
  if (filled.length === 5) bonus += 1;

  const allFit = lineup.every((p) => {
    const fit = positionFit(p.position as never, p.slot, p.compatible as never[]);
    return fit >= 0.93;
  });
  if (allFit) bonus += 2;

  const zones: ZoneId[] = ["defensa", "mediocampo", "ataque"];
  const weakZone = zones.some((zone) => {
    const members = lineup.filter((p) => zoneOfSlot(p.slot) === zone);
    if (members.length === 0) return true;
    const avg = members.reduce((a, p) => a + p.rating, 0) / members.length;
    return avg < 62;
  });
  if (!weakZone) bonus += 1;

  const avgRating = lineup.reduce((a, p) => a + p.rating, 0) / Math.max(1, lineup.length);
  if (avgRating >= 72) bonus += 1;

  return Math.min(5, bonus);
}

/** Poder individual del jugador en su puesto (rating + fit + rol + zona). */
export function slotPower(
  player: LineupPlayer,
  style: TeamStyle,
  zone: ZoneId,
  lineup: LineupPlayer[],
): number {
  const fit = positionFit(player.position as never, player.slot, player.compatible as never[]);
  const individual = rolePower(player, player.position as never);
  const zonal = zoneRawPower(player, zone);
  const base = ((individual + zonal) / 2) * fit;
  const ratingBoost = 0.85 + (player.rating / 100) * 0.3;
  const conn = 1 + connectionBonus(lineup) / 100;
  return clampPower(base * ratingBoost * conn * styleModifier(style, zone));
}

export function zonePower(lineup: LineupPlayer[], zone: ZoneId, style: TeamStyle): number {
  const members = lineup.filter((p) => zoneOfSlot(p.slot) === zone);
  if (members.length === 0) return 40;
  const values = members.map((p) => slotPower(p, style, zone, lineup));
  return clampPower(values.reduce((a, b) => a + b, 0) / values.length);
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

function push(seed: string, moment: number, slot: string, side: string): number {
  return (hash(`${seed}:${moment}:${slot}:${side}`) % 7) - 3;
}

async function buildUserLineup(userId: string): Promise<LineupPlayer[]> {
  const squad = await getOrCreateFutbol5Squad(userId);
  const bySlot = new Map(squad.slots.map((s) => [s.slotKey, s.card]));

  const cardIds = squad.slots.map((s) => s.cardId).filter(Boolean) as string[];
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    include: { template: true },
  });
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return F5_SLOTS.map((slot) => {
    const raw = bySlot.get(slot);
    if (!raw) {
      throw new TeamGameError(
        "Necesitás un equipo completo (5 fichas) para jugar. Armalo en Mi equipo.",
        409,
      );
    }
    const full = cardMap.get(raw.id);
    if (!full) {
      throw new TeamGameError("Tu alineación tiene una ficha inválida. Rearmá el equipo.", 409);
    }
    return fromCard(slot, full);
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
  const filled = squad.slots.filter((s) => s.cardId).length;
  if (filled < F5_SLOTS.length) {
    throw new TeamGameError(
      "Necesitás un equipo completo (5 fichas) para jugar. Armalo en Mi equipo.",
      409,
    );
  }

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

function resolveDuels(
  lineupUser: LineupPlayer[],
  lineupBot: LineupPlayer[],
  styleUser: TeamStyle,
  styleBot: TeamStyle,
  momentIndex: number,
  playType: PlayType,
  seed: string,
): { duels: SlotDuel[]; userPoints: number; botPoints: number; userPower: number; botPower: number } {
  const slots = momentSlots(momentIndex);
  const zone = momentZone(momentIndex);
  const mult = playMultiplier(playType);
  const cost = PLAY_COST[playType];
  const basePerSlot = cost / slots.length;

  const duels: SlotDuel[] = slots.map((slot) => {
    const userP = lineupUser.find((p) => p.slot === slot)!;
    const botP = lineupBot.find((p) => p.slot === slot)!;
    const duelZone = zoneOfSlot(slot);

    const userPower = clampPower(
      slotPower(userP, styleUser, duelZone, lineupUser) +
        push(seed, momentIndex, slot, "user"),
    );
    const botPower = clampPower(
      slotPower(botP, styleBot, duelZone, lineupBot) +
        push(seed, momentIndex, slot, "bot"),
    );

    const fitUser = positionFit(userP.position as never, slot, userP.compatible as never[]);
    const fitBot = positionFit(botP.position as never, slot, botP.compatible as never[]);

    let winner: SlotDuel["winner"] = "tie";
    let userPoints = 0;
    let botPoints = 0;

    if (userPower > botPower) {
      winner = "user";
      // Más rating y mejor puesto → más puntos al ganar el choque.
      userPoints = Math.max(
        1,
        Math.round(basePerSlot * mult.win * (userP.rating / 70) * fitUser),
      );
    } else if (botPower > userPower) {
      winner = "bot";
      botPoints = Math.max(
        1,
        Math.round(basePerSlot * mult.lose * (botP.rating / 70) * fitBot),
      );
    } else {
      userPoints = Math.max(1, Math.round(basePerSlot * 0.35));
      botPoints = Math.max(1, Math.round(basePerSlot * 0.35));
    }

    return {
      slot,
      userName: userP.name,
      botName: botP.name,
      userPower,
      botPower,
      userPoints,
      botPoints,
      winner,
      userCardId: userP.cardId,
    };
  });

  const userPoints = duels.reduce((a, d) => a + d.userPoints, 0);
  const botPoints = duels.reduce((a, d) => a + d.botPoints, 0);
  const userPower = clampPower(
    duels.reduce((a, d) => a + d.userPower, 0) / duels.length,
  );
  const botPower = clampPower(
    duels.reduce((a, d) => a + d.botPower, 0) / duels.length,
  );

  return { duels, userPoints, botPoints, userPower, botPower };
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

  const resolved = resolveDuels(
    lineupUser,
    lineupBot,
    match.styleUser,
    match.styleBot,
    match.momentIndex,
    playType,
    match.seed,
  );

  let winner: MomentLog["winner"] = "tie";
  if (resolved.userPoints > resolved.botPoints) winner = "user";
  else if (resolved.botPoints > resolved.userPoints) winner = "bot";

  const wins = resolved.duels.filter((d) => d.winner === "user").length;
  const losses = resolved.duels.filter((d) => d.winner === "bot").length;

  const log: MomentLog = {
    index: match.momentIndex,
    label: MOMENT_LABELS[match.momentIndex],
    playType,
    impulseSpent: cost,
    zone,
    userPower: resolved.userPower,
    botPower: resolved.botPower,
    userPoints: resolved.userPoints,
    botPoints: resolved.botPoints,
    winner,
    hint:
      winner === "user"
        ? `Ganaste ${wins} duelo${wins === 1 ? "" : "s"} de puesto`
        : winner === "bot"
          ? `El rival ganó ${losses} duelo${losses === 1 ? "" : "s"} de puesto`
          : "Choques parejos en los puestos",
    duels: resolved.duels,
  };

  const moments = [...asMoments(match.moments), log];
  const scoreUser = match.scoreUser + resolved.userPoints;
  const scoreOpponent = match.scoreOpponent + resolved.botPoints;
  const impulseLeft = match.impulseLeft - cost;
  const nextMoment = match.momentIndex + 1;
  const finished = nextMoment >= MOMENTS_TOTAL;

  // XP a las cartas que ganaron su puesto en este momento.
  const winningCardIds = resolved.duels
    .filter((d) => d.winner === "user" && d.userCardId)
    .map((d) => d.userCardId as string);

  if (!finished) {
    if (winningCardIds.length > 0) {
      await prisma.card.updateMany({
        where: { id: { in: winningCardIds }, userId: user.id },
        data: { xp: { increment: POSITION_WIN_XP } },
      });
    }
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

  const ops: Prisma.PrismaPromise<unknown>[] = [
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
  ];

  if (winningCardIds.length > 0) {
    ops.push(
      prisma.card.updateMany({
        where: { id: { in: winningCardIds }, userId: user.id },
        data: { xp: { increment: POSITION_WIN_XP } },
      }),
    );
  }

  const [updated] = await prisma.$transaction(ops);
  return updated as TeamMatch;
}

function publicPlayer(p: LineupPlayer) {
  return {
    slot: p.slot,
    name: p.name,
    position: p.position,
    rarity: p.rarity,
    rating: p.rating,
    flag: p.flag,
    imageUrl: p.imageUrl,
    isAcademy: p.isAcademy,
  };
}

export function toTeamMatchView(match: TeamMatch) {
  const lineupUser = asLineup(match.lineupUser);
  const lineupBot = asLineup(match.lineupBot);
  const moments = asMoments(match.moments);
  const activeSlots = momentSlots(Math.min(match.momentIndex, MOMENTS_TOTAL - 1));

  const zones = (["defensa", "mediocampo", "ataque"] as ZoneId[]).map((zone) => {
    const power = zonePower(lineupBot, zone, match.styleBot);
    return {
      zone,
      range: [Math.max(40, power - 4), Math.min(100, power + 4)] as [number, number],
      cards: lineupBot
        .filter((p) => zoneOfSlot(p.slot) === zone)
        .map((p) => publicPlayer(p)),
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
    activeZone: momentZone(Math.min(match.momentIndex, MOMENTS_TOTAL - 1)),
    activeSlots,
    moments,
    you: lineupUser.map(publicPlayer),
    rival: lineupBot.map(publicPlayer),
    rivalZones: zones,
    connection: connectionBonus(lineupUser),
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
