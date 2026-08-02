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
  MOMENT_HELP,
  MOMENT_LABELS,
  PLAY_COST,
  PLAY_INFO,
  PLAY_LABELS,
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
  why: string;
}

export interface MomentLog {
  index: number;
  label: string;
  playType: PlayType;
  botPlayType: PlayType;
  impulseSpent: number;
  zone: ZoneId;
  userPower: number;
  botPower: number;
  userPoints: number;
  botPoints: number;
  winner: "user" | "bot" | "tie";
  hint: string;
  why: string;
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

export function teamValues(lineup: LineupPlayer[], style: TeamStyle) {
  const ataque = zonePower(lineup, "ataque", style);
  const mediocampo = zonePower(lineup, "mediocampo", style);
  const defensa = zonePower(lineup, "defensa", style);
  const por = lineup.find((p) => p.slot === "POR");
  const arquero = por
    ? slotPower(por, style, "defensa", lineup)
    : 40;
  const equilibrio = connectionBonus(lineup);
  return { ataque, mediocampo, defensa, arquero, equilibrio };
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

/**
 * El rival elige primero (determinístico por seed + momento + su estilo).
 * No depende de tus cambios, así lo que ves es lo que realmente juega.
 */
export function pickBotPlay(
  seed: string,
  momentIndex: number,
  styleBot: TeamStyle,
): PlayType {
  const roll = hash(`${seed}:botplay:${momentIndex}`) % 100;

  if (styleBot === "ataque") {
    if (roll < 25) return "seguro";
    if (roll < 60) return "combinado";
    return "total";
  }
  if (styleBot === "defensa") {
    if (roll < 50) return "seguro";
    if (roll < 85) return "combinado";
    return "total";
  }
  if (roll < 34) return "seguro";
  if (roll < 70) return "combinado";
  return "total";
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

function swapLineupSlots(lineup: LineupPlayer[], a: F5Slot, b: F5Slot): LineupPlayer[] {
  if (a === b) return lineup;
  const copy = lineup.map((p) => ({ ...p }));
  const ia = copy.findIndex((p) => p.slot === a);
  const ib = copy.findIndex((p) => p.slot === b);
  if (ia < 0 || ib < 0) {
    throw new TeamGameError("No se pudo mover esas fichas", 400);
  }
  const playerA = { ...copy[ia], slot: b };
  const playerB = { ...copy[ib], slot: a };
  copy[ia] = playerB;
  copy[ib] = playerA;
  // Orden estable por F5_SLOTS
  return F5_SLOTS.map((slot) => copy.find((p) => p.slot === slot)!);
}

function resolveDuels(
  lineupUser: LineupPlayer[],
  lineupBot: LineupPlayer[],
  styleUser: TeamStyle,
  styleBot: TeamStyle,
  momentIndex: number,
  userPlay: PlayType,
  botPlay: PlayType,
  seed: string,
  userCostScale = 1,
): { duels: SlotDuel[]; userPoints: number; botPoints: number; userPower: number; botPower: number } {
  const slots = momentSlots(momentIndex);
  const userInfo = PLAY_INFO[userPlay];
  const botInfo = PLAY_INFO[botPlay];
  const userCost = PLAY_COST[userPlay] * userCostScale;
  const botCost = PLAY_COST[botPlay];
  const userBase = userCost / slots.length;
  const botBase = botCost / slots.length;

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
    let why = "";

    if (userPower > botPower) {
      winner = "user";
      userPoints = Math.max(
        1,
        Math.round(userBase * userInfo.winMult * (userP.rating / 70) * fitUser),
      );
      why = `${userP.name} (${userPower}) ganó a ${botP.name} (${botPower}) → +${userPoints} pts`;
    } else if (botPower > userPower) {
      winner = "bot";
      botPoints = Math.max(
        1,
        Math.round(botBase * botInfo.winMult * (botP.rating / 70) * fitBot),
      );
      why = `${botP.name} (${botPower}) ganó a ${userP.name} (${userPower}) → rival +${botPoints}`;
    } else {
      userPoints = Math.max(1, Math.round(userBase * 0.35));
      botPoints = Math.max(1, Math.round(botBase * 0.35));
      why = `${userP.name} y ${botP.name} empataron (${userPower})`;
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
      why,
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
  input: {
    playType: PlayType;
    style?: TeamStyle;
    swap?: [F5Slot, F5Slot];
  },
) {
  const playType = input.playType;
  if (!PLAY_COST[playType]) {
    throw new TeamGameError("Elegí un tipo de jugada válido", 400);
  }

  const match = await prisma.teamMatch.findFirst({
    where: { id: matchId, userId: user.id },
  });
  if (!match) throw new TeamGameError("No encontramos ese partido", 404);
  if (match.status === "finished") throw new TeamGameError("Este partido ya terminó", 409);

  const nominal = PLAY_COST[playType];
  let cost = nominal;

  if (match.impulseLeft <= 0) {
    throw new TeamGameError("No te queda impulso. Empezá otro partido.", 409);
  }

  if (match.impulseLeft < nominal) {
    // Último aliento: podés cerrar el turno con lo que te queda (solo jugada segura).
    if (playType !== "seguro") {
      throw new TeamGameError(
        `Solo te quedan ${match.impulseLeft} de impulso. Usá la jugada segura.`,
        409,
      );
    }
    cost = match.impulseLeft;
  }

  let lineupUser = asLineup(match.lineupUser);
  const lineupBot = asLineup(match.lineupBot);
  const styleUser = input.style ?? match.styleUser;
  const zone = momentZone(match.momentIndex);

  if (input.swap) {
    lineupUser = swapLineupSlots(lineupUser, input.swap[0], input.swap[1]);
  }

  const botPlay = pickBotPlay(match.seed, match.momentIndex, match.styleBot);

  const resolved = resolveDuels(
    lineupUser,
    lineupBot,
    styleUser,
    match.styleBot,
    match.momentIndex,
    playType,
    botPlay,
    match.seed,
    cost / nominal, // escala puntos si jugás con menos impulso
  );

  let winner: MomentLog["winner"] = "tie";
  if (resolved.userPoints > resolved.botPoints) winner = "user";
  else if (resolved.botPoints > resolved.userPoints) winner = "bot";

  const wins = resolved.duels.filter((d) => d.winner === "user").length;
  const losses = resolved.duels.filter((d) => d.winner === "bot").length;

  const whyParts = [
    `Rival jugó ${PLAY_LABELS[botPlay]} (arriesgó ${PLAY_COST[botPlay]}).`,
    `Vos jugaste ${PLAY_LABELS[playType]} (arriesgaste ${cost}).`,
    winner === "user"
      ? `Ganaste el momento ${resolved.userPoints} a ${resolved.botPoints} porque ganaste ${wins} duelo(s) de puesto.`
      : winner === "bot"
        ? `Perdiste el momento ${resolved.userPoints} a ${resolved.botPoints}: el rival ganó ${losses} duelo(s).`
        : `Momento empatado ${resolved.userPoints} a ${resolved.botPoints}.`,
  ];

  const log: MomentLog = {
    index: match.momentIndex,
    label: MOMENT_LABELS[match.momentIndex],
    playType,
    botPlayType: botPlay,
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
    why: whyParts.join(" "),
    duels: resolved.duels,
  };

  const moments = [...asMoments(match.moments), log];
  const scoreUser = match.scoreUser + resolved.userPoints;
  const scoreOpponent = match.scoreOpponent + resolved.botPoints;
  const impulseLeft = match.impulseLeft - cost;
  const nextMoment = match.momentIndex + 1;
  const finished = nextMoment >= MOMENTS_TOTAL;

  const winningCardIds = resolved.duels
    .filter((d) => d.winner === "user" && d.userCardId)
    .map((d) => d.userCardId as string);

  const baseData = {
    moments: moments as unknown as Prisma.InputJsonValue,
    scoreUser,
    scoreOpponent,
    impulseLeft,
    momentIndex: nextMoment,
    styleUser,
    lineupUser: lineupUser as unknown as Prisma.InputJsonValue,
  };

  if (!finished) {
    if (winningCardIds.length > 0) {
      await prisma.card.updateMany({
        where: { id: { in: winningCardIds }, userId: user.id },
        data: { xp: { increment: POSITION_WIN_XP } },
      });
    }
    return prisma.teamMatch.update({
      where: { id: match.id },
      data: baseData,
    });
  }

  const result =
    scoreUser > scoreOpponent ? "win" : scoreOpponent > scoreUser ? "loss" : "draw";
  const reward = TEAM_REWARDS[result];

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.teamMatch.update({
      where: { id: match.id },
      data: {
        ...baseData,
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
  const idx = Math.min(match.momentIndex, MOMENTS_TOTAL - 1);
  const activeSlots = momentSlots(idx);
  const zone = momentZone(idx);

  const youValues = teamValues(lineupUser, match.styleUser);
  const rivalValues = teamValues(lineupBot, match.styleBot);

  const userZone = zonePower(lineupUser, zone, match.styleUser);
  const botZone = zonePower(lineupBot, zone, match.styleBot);
  const rivalPlayType =
    match.status === "active"
      ? pickBotPlay(match.seed, match.momentIndex, match.styleBot)
      : null;

  const estimateWin = (play: PlayType) => {
    const slots = activeSlots.length;
    const avgRating =
      lineupUser
        .filter((p) => activeSlots.includes(p.slot))
        .reduce((a, p) => a + p.rating, 0) / Math.max(1, slots);
    const base = PLAY_COST[play] / slots;
    return Math.max(1, Math.round(base * PLAY_INFO[play].winMult * (avgRating / 70) * slots));
  };

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
    momentLabel: MOMENT_LABELS[idx],
    momentHelp: MOMENT_HELP[idx],
    activeZone: zone,
    activeSlots,
    moments,
    you: lineupUser.map(publicPlayer),
    rival: lineupBot.map(publicPlayer),
    youValues,
    rivalValues,
    connection: youValues.equilibrio,
    rivalPlay: rivalPlayType
      ? {
          playType: rivalPlayType,
          label: PLAY_LABELS[rivalPlayType],
          cost: PLAY_COST[rivalPlayType],
          risk: PLAY_INFO[rivalPlayType].risk,
          ifWin: PLAY_INFO[rivalPlayType].ifWin,
          zonePower: botZone,
        }
      : null,
    yourZonePower: userZone,
    lastBreath: match.impulseLeft > 0 && match.impulseLeft < PLAY_COST.seguro,
    playOptions: (Object.keys(PLAY_COST) as PlayType[]).map((playType) => {
      const nominal = PLAY_COST[playType];
      const lastBreath =
        playType === "seguro" &&
        match.impulseLeft > 0 &&
        match.impulseLeft < nominal;
      return {
        playType,
        ...PLAY_INFO[playType],
        cost: lastBreath ? match.impulseLeft : nominal,
        canAfford:
          match.impulseLeft >= nominal ||
          (playType === "seguro" && match.impulseLeft > 0),
        approxWinPoints: estimateWin(playType),
        lastBreath,
      };
    }),
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
