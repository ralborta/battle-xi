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
  MAX_SWAPS_PER_TURN,
  MOMENTS_TOTAL,
  MOMENT_HELP,
  MOMENT_LABELS,
  PLAY_COST,
  PLAY_INFO,
  PLAY_LABELS,
  type PlayType,
  POSITION_WIN_XP,
  REINFORCE_ZONE_BOOST,
  TACTIC_CORRECT_BONUS,
  TACTIC_WRONG_PENALTY,
  TEAM_REWARDS,
  ZONE_LABELS,
  clampPower,
  pressureHelp,
  responseZone,
  slotsForZone,
  softenPower,
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
  /** Zona que presiona el rival. */
  pressure: ZoneId;
  /** Zona tuya que responde. */
  response: ZoneId;
  reinforce: ZoneId | null;
  tacticCorrect: boolean;
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

/** Dónde presiona el rival este turno (vos tenés que leerlo y reforzar la respuesta). */
export function pickBotPressure(
  seed: string,
  momentIndex: number,
  styleBot: TeamStyle,
): ZoneId {
  const roll = hash(`${seed}:pressure:${momentIndex}`) % 100;
  const zones: ZoneId[] = ["ataque", "mediocampo", "defensa"];

  // Sesgo por estilo, con ruido para que no sea predecible al 100%.
  if (styleBot === "ataque") {
    if (roll < 55) return "ataque";
    if (roll < 80) return "mediocampo";
    return "defensa";
  }
  if (styleBot === "defensa") {
    if (roll < 50) return "defensa";
    if (roll < 75) return "mediocampo";
    return "ataque";
  }
  // equilibrio + variación por momento
  const bias = momentIndex % 3;
  if (roll < 40) return zones[bias];
  if (roll < 70) return zones[(bias + 1) % 3];
  return zones[(bias + 2) % 3];
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

function resolveTacticalClash(
  lineupUser: LineupPlayer[],
  lineupBot: LineupPlayer[],
  styleUser: TeamStyle,
  styleBot: TeamStyle,
  momentIndex: number,
  pressure: ZoneId,
  reinforce: ZoneId | null,
  userPlay: PlayType,
  botPlay: PlayType,
  seed: string,
  userCostScale = 1,
): {
  duels: SlotDuel[];
  userPoints: number;
  botPoints: number;
  userPower: number;
  botPower: number;
  response: ZoneId;
  tacticCorrect: boolean;
} {
  const response = responseZone(pressure);
  const userSlots = slotsForZone(response);
  const botSlots = slotsForZone(pressure);

  // Parear puestos (si hay distinto número, se repiten del lado más corto).
  const pairCount = Math.max(userSlots.length, botSlots.length);
  const pairs: Array<{ userSlot: F5Slot; botSlot: F5Slot }> = [];
  for (let i = 0; i < pairCount; i++) {
    pairs.push({
      userSlot: userSlots[i % userSlots.length],
      botSlot: botSlots[i % botSlots.length],
    });
  }

  let userZonePow = softenPower(zonePower(lineupUser, response, styleUser));
  let botZonePow = softenPower(zonePower(lineupBot, pressure, styleBot));

  const tacticCorrect = reinforce === response;
  if (reinforce === response) {
    userZonePow = clampPower(userZonePow * (1 + REINFORCE_ZONE_BOOST + TACTIC_CORRECT_BONUS));
  } else if (reinforce) {
    userZonePow = clampPower(userZonePow * (1 - TACTIC_WRONG_PENALTY));
    // Reforzaste otra zona: ese boost no ayuda al choque principal.
  }

  const userInfo = PLAY_INFO[userPlay];
  const botInfo = PLAY_INFO[botPlay];
  const userCost = PLAY_COST[userPlay] * userCostScale;
  const botCost = PLAY_COST[botPlay];

  // ~70% del puntaje viene del choque de zona (lectura táctica).
  let userPoints = 0;
  let botPoints = 0;
  if (userZonePow > botZonePow + 1) {
    userPoints += Math.max(
      2,
      Math.round(userCost * 0.7 * userInfo.winMult * (userZonePow / 80)),
    );
  } else if (botZonePow > userZonePow + 1) {
    botPoints += Math.max(
      2,
      Math.round(botCost * 0.7 * botInfo.winMult * (botZonePow / 80)),
    );
  } else {
    userPoints += Math.max(1, Math.round(userCost * 0.25));
    botPoints += Math.max(1, Math.round(botCost * 0.25));
  }

  // ~30% en duelos individuales (narrativa + un poco de OVR).
  const duelShare = 0.3;
  const userBase = (userCost * duelShare) / pairs.length;
  const botBase = (botCost * duelShare) / pairs.length;

  const duels: SlotDuel[] = pairs.map(({ userSlot, botSlot }, i) => {
    const userP = lineupUser.find((p) => p.slot === userSlot)!;
    const botP = lineupBot.find((p) => p.slot === botSlot)!;

    let uPow = softenPower(
      slotPower(userP, styleUser, response, lineupUser) +
        push(seed, momentIndex, `${userSlot}-${i}`, "user"),
    );
    let bPow = softenPower(
      slotPower(botP, styleBot, pressure, lineupBot) +
        push(seed, momentIndex, `${botSlot}-${i}`, "bot"),
    );

    if (tacticCorrect) uPow = clampPower(uPow * (1 + TACTIC_CORRECT_BONUS * 0.5));

    const fitUser = positionFit(userP.position as never, userSlot, userP.compatible as never[]);
    const fitBot = positionFit(botP.position as never, botSlot, botP.compatible as never[]);

    let winner: SlotDuel["winner"] = "tie";
    let uPts = 0;
    let bPts = 0;
    let why = "";

    if (uPow > bPow) {
      winner = "user";
      uPts = Math.max(
        1,
        Math.round(userBase * userInfo.winMult * (0.7 + 0.3 * (userP.rating / 80)) * fitUser),
      );
      why = `${userP.name} (${uPow}) frenó/superó a ${botP.name} (${bPow}) → +${uPts}`;
    } else if (bPow > uPow) {
      winner = "bot";
      bPts = Math.max(
        1,
        Math.round(botBase * botInfo.winMult * (0.7 + 0.3 * (botP.rating / 80)) * fitBot),
      );
      why = `${botP.name} (${bPow}) ganó a ${userP.name} (${uPow}) → rival +${bPts}`;
    } else {
      uPts = Math.max(1, Math.round(userBase * 0.35));
      bPts = Math.max(1, Math.round(botBase * 0.35));
      why = `${userP.name} y ${botP.name} empataron`;
    }

    userPoints += uPts;
    botPoints += bPts;

    return {
      slot: userSlot,
      userName: userP.name,
      botName: botP.name,
      userPower: uPow,
      botPower: bPow,
      userPoints: uPts,
      botPoints: bPts,
      winner,
      userCardId: userP.cardId,
      why,
    };
  });

  return {
    duels,
    userPoints,
    botPoints,
    userPower: userZonePow,
    botPower: botZonePow,
    response,
    tacticCorrect,
  };
}

export async function playTeamMoment(
  user: User,
  matchId: string,
  input: {
    playType: PlayType;
    style?: TeamStyle;
    swap?: [F5Slot, F5Slot];
    reinforce?: ZoneId | null;
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

  if (input.swap) {
    lineupUser = swapLineupSlots(lineupUser, input.swap[0], input.swap[1]);
  }

  const pressure = pickBotPressure(match.seed, match.momentIndex, match.styleBot);
  const botPlay = pickBotPlay(match.seed, match.momentIndex, match.styleBot);
  const reinforce = input.reinforce ?? null;
  const needed = responseZone(pressure);

  const resolved = resolveTacticalClash(
    lineupUser,
    lineupBot,
    styleUser,
    match.styleBot,
    match.momentIndex,
    pressure,
    reinforce,
    playType,
    botPlay,
    match.seed,
    cost / nominal,
  );

  let winner: MomentLog["winner"] = "tie";
  if (resolved.userPoints > resolved.botPoints) winner = "user";
  else if (resolved.botPoints > resolved.userPoints) winner = "bot";

  const whyParts = [
    `Rival presionó ${ZONE_LABELS[pressure]} con ${PLAY_LABELS[botPlay]} (−${PLAY_COST[botPlay]}).`,
    `Respuesta correcta: reforzar ${ZONE_LABELS[needed]}.`,
    reinforce
      ? resolved.tacticCorrect
        ? `Reforzaste bien ${ZONE_LABELS[reinforce]} (+bonus táctico).`
        : `Reforzaste ${ZONE_LABELS[reinforce]} (zona incorrecta, penalidad).`
      : "No reforzaste ninguna zona.",
    `Choque de zona ${resolved.userPower} vs ${resolved.botPower}.`,
    `Vos arriesgaste ${cost} (${PLAY_LABELS[playType]}).`,
    winner === "user"
      ? `Ganaste el turno ${resolved.userPoints} a ${resolved.botPoints}.`
      : winner === "bot"
        ? `Perdiste el turno ${resolved.userPoints} a ${resolved.botPoints}.`
        : `Empate ${resolved.userPoints} a ${resolved.botPoints}.`,
  ];

  const log: MomentLog = {
    index: match.momentIndex,
    label: MOMENT_LABELS[match.momentIndex],
    playType,
    botPlayType: botPlay,
    impulseSpent: cost,
    pressure,
    response: resolved.response,
    reinforce,
    tacticCorrect: resolved.tacticCorrect,
    zone: resolved.response,
    userPower: resolved.userPower,
    botPower: resolved.botPower,
    userPoints: resolved.userPoints,
    botPoints: resolved.botPoints,
    winner,
    hint: resolved.tacticCorrect
      ? "Lectura táctica correcta"
      : reinforce
        ? "Refuerzo en zona incorrecta"
        : "Sin refuerzo táctico",
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

  const youValues = teamValues(lineupUser, match.styleUser);
  const rivalValues = teamValues(lineupBot, match.styleBot);

  const pressure =
    match.status === "active"
      ? pickBotPressure(match.seed, match.momentIndex, match.styleBot)
      : ("ataque" as ZoneId);
  const response = responseZone(pressure);
  const activeSlots = slotsForZone(response);
  const rivalSlots = slotsForZone(pressure);

  const yourZonePower = softenPower(zonePower(lineupUser, response, match.styleUser));
  const rivalZonePower = softenPower(zonePower(lineupBot, pressure, match.styleBot));
  const rivalPlayType =
    match.status === "active"
      ? pickBotPlay(match.seed, match.momentIndex, match.styleBot)
      : null;

  const estimateWin = (play: PlayType) => {
    const base = PLAY_COST[play] * 0.7;
    return Math.max(
      2,
      Math.round(base * PLAY_INFO[play].winMult * (yourZonePower / 80)),
    );
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
    pressure,
    response,
    pressureHelp: pressureHelp(pressure),
    activeZone: response,
    activeSlots,
    rivalSlots,
    maxSwaps: MAX_SWAPS_PER_TURN,
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
          zonePower: rivalZonePower,
          pressure,
          pressureLabel: ZONE_LABELS[pressure],
          response,
          responseLabel: ZONE_LABELS[response],
        }
      : null,
    yourZonePower,
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
