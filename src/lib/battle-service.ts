import "server-only";

import { randomUUID } from "node:crypto";
import type { Battle, Card, Prisma, User } from "@/generated/prisma/client";
import { POSITIONS, generateCard } from "@/lib/card-generator";
import { prisma } from "@/lib/db";
import {
  type BattleRound,
  type BattleView,
  type StatKey,
  ENERGY_PER_BATTLE,
  REWARDS,
  ROUNDS_PER_BATTLE,
  battleResult,
  cardLevelFromXp,
  currentEnergy,
  levelBonus,
  resolveRound,
} from "@/lib/game";

export class GameError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Nombres inventados: el rival del sistema no usa jugadores reales. */
const BOT_NAMES = ["Kairo", "Tato", "Bruno", "Zeta", "Nico", "Rulo", "Milo", "Fausto", "Ciro", "Lito"];
const BOT_FLAGS = ["🇦🇷", "🇧🇷", "🇺🇾", "🇨🇴", "🇪🇸", "🇫🇷"];

type BattleWithCard = Battle & { card: Card };

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface OpponentSnapshot {
  opponentUserId: string | null;
  opponentCardId: string | null;
  opponentNickname: string;
  opponentName: string;
  opponentPosition: Card["position"];
  opponentRarity: Card["rarity"];
  opponentRating: number;
  opponentLevel: number;
  opponentFlag: string;
  opponentImageUrl: string | null;
  opponentVel: number;
  opponentTir: number;
  opponentPas: number;
  opponentReg: number;
  opponentDef: number;
  opponentFis: number;
  isBot: boolean;
}

/**
 * Buscamos una carta real de otro chico con rating parecido. Mientras el juego
 * esté vacío no hay contra quién jugar, así que armamos un rival del sistema.
 */
async function pickOpponent(userId: string, card: Card): Promise<OpponentSnapshot> {
  const nearby = await prisma.card.findMany({
    where: {
      userId: { not: userId },
      rating: { gte: card.rating - 12, lte: card.rating + 12 },
    },
    include: { user: { select: { nickname: true } } },
    take: 40,
  });

  const pool =
    nearby.length > 0
      ? nearby
      : await prisma.card.findMany({
          where: { userId: { not: userId } },
          include: { user: { select: { nickname: true } } },
          take: 40,
        });

  if (pool.length > 0) {
    const rival = pickRandom(pool);
    return {
      opponentUserId: rival.userId,
      opponentCardId: rival.id,
      opponentNickname: rival.user.nickname,
      opponentName: rival.playerName,
      opponentPosition: rival.position,
      opponentRarity: rival.rarity,
      opponentRating: rival.rating,
      opponentLevel: rival.level,
      opponentFlag: rival.countryFlag,
      opponentImageUrl: rival.imageUrl,
      opponentVel: rival.vel,
      opponentTir: rival.tir,
      opponentPas: rival.pas,
      opponentReg: rival.reg,
      opponentDef: rival.def,
      opponentFis: rival.fis,
      isBot: false,
    };
  }

  const position = pickRandom(POSITIONS);
  const rating = card.rating + Math.floor(Math.random() * 11) - 5;
  const generated = generateCard(randomUUID(), position, rating);

  return {
    opponentUserId: null,
    opponentCardId: null,
    opponentNickname: "Equipo Fantasma",
    opponentName: pickRandom(BOT_NAMES),
    opponentPosition: position,
    opponentRarity: generated.rarity,
    opponentRating: generated.rating,
    opponentLevel: card.level,
    opponentFlag: pickRandom(BOT_FLAGS),
    opponentImageUrl: null,
    opponentVel: generated.vel,
    opponentTir: generated.tir,
    opponentPas: generated.pas,
    opponentReg: generated.reg,
    opponentDef: generated.def,
    opponentFis: generated.fis,
    isBot: true,
  };
}

export async function startBattle(user: User, cardId: string): Promise<BattleWithCard> {
  const existing = await prisma.battle.findFirst({
    where: { userId: user.id, status: "active" },
    include: { card: true },
  });
  // Un duelo abierto por vez: evita que se escape energía si se corta la conexión.
  if (existing) return existing;

  const card = await prisma.card.findFirst({ where: { id: cardId, userId: user.id } });
  if (!card) throw new GameError("Esa carta no está en tu colección", 404);

  const { energy, anchor } = currentEnergy(user.energy, user.energyUpdatedAt);
  if (energy < ENERGY_PER_BATTLE) {
    throw new GameError("Te quedaste sin energía. Esperá unos minutos y volvé.", 409);
  }

  const opponent = await pickOpponent(user.id, card);

  const [battle] = await prisma.$transaction([
    prisma.battle.create({
      data: {
        userId: user.id,
        cardId: card.id,
        seed: randomUUID(),
        ...opponent,
      },
      include: { card: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { energy: energy - ENERGY_PER_BATTLE, energyUpdatedAt: anchor },
    }),
  ]);

  return battle;
}

export async function getBattle(userId: string, battleId: string): Promise<BattleWithCard> {
  const battle = await prisma.battle.findFirst({
    where: { id: battleId, userId },
    include: { card: true },
  });
  if (!battle) throw new GameError("No encontramos ese duelo", 404);
  return battle;
}

function readRounds(battle: Battle): BattleRound[] {
  return (battle.rounds as unknown as BattleRound[]) ?? [];
}

const OPPONENT_STAT: Record<StatKey, keyof Battle> = {
  vel: "opponentVel",
  tir: "opponentTir",
  pas: "opponentPas",
  reg: "opponentReg",
  def: "opponentDef",
  fis: "opponentFis",
};

export async function playRound(
  user: User,
  battleId: string,
  stat: StatKey,
): Promise<BattleWithCard> {
  const battle = await getBattle(user.id, battleId);
  if (battle.status === "finished") {
    throw new GameError("Este duelo ya terminó", 409);
  }

  const rounds = readRounds(battle);
  if (rounds.some((round) => round.stat === stat)) {
    throw new GameError("Ya usaste esa habilidad en este duelo", 409);
  }

  const round = resolveRound({
    seed: battle.seed,
    roundIndex: rounds.length,
    stat,
    userStat: battle.card[stat],
    userLevel: battle.card.level,
    opponentStat: battle[OPPONENT_STAT[stat]] as number,
    opponentLevel: battle.opponentLevel,
  });

  const nextRounds = [...rounds, round];
  const scoreUser = nextRounds.filter((r) => r.winner === "user").length;
  const scoreOpponent = nextRounds.filter((r) => r.winner === "opponent").length;
  const isLast = nextRounds.length >= ROUNDS_PER_BATTLE;

  if (!isLast) {
    return prisma.battle.update({
      where: { id: battle.id },
      data: {
        rounds: nextRounds as unknown as Prisma.InputJsonValue,
        scoreUser,
        scoreOpponent,
      },
      include: { card: true },
    });
  }

  const result = battleResult(scoreUser, scoreOpponent);
  const reward = REWARDS[result];
  const cardXp = battle.card.xp + reward.cardXp;

  const [finished] = await prisma.$transaction([
    prisma.battle.update({
      where: { id: battle.id },
      data: {
        rounds: nextRounds as unknown as Prisma.InputJsonValue,
        scoreUser,
        scoreOpponent,
        status: "finished",
        result,
        finishedAt: new Date(),
        gemsEarned: reward.gems,
        xpEarned: reward.xp,
        trophiesDelta: reward.trophies,
      },
      include: { card: true },
    }),
    prisma.card.update({
      where: { id: battle.cardId },
      data: { xp: cardXp, level: cardLevelFromXp(cardXp) },
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

  return finished;
}

/** El cliente nunca ve las stats del rival sin jugar: si no, elegir sería trivial. */
export function toBattleView(battle: BattleWithCard): BattleView {
  const rounds = readRounds(battle);

  return {
    id: battle.id,
    status: battle.status,
    result: battle.result,
    scoreUser: battle.scoreUser,
    scoreOpponent: battle.scoreOpponent,
    roundIndex: rounds.length,
    roundsTotal: ROUNDS_PER_BATTLE,
    rounds,
    usedStats: rounds.map((round) => round.stat),
    you: {
      name: battle.card.playerName,
      rating: battle.card.rating,
      position: battle.card.position,
      rarity: battle.card.rarity,
      flag: battle.card.countryFlag,
      level: battle.card.level,
      levelBonus: levelBonus(battle.card.level),
      imageUrl: battle.card.imageUrl,
      stats: {
        vel: battle.card.vel,
        tir: battle.card.tir,
        pas: battle.card.pas,
        reg: battle.card.reg,
        def: battle.card.def,
        fis: battle.card.fis,
      },
    },
    opponent: {
      nickname: battle.opponentNickname,
      name: battle.opponentName,
      rating: battle.opponentRating,
      position: battle.opponentPosition,
      rarity: battle.opponentRarity,
      flag: battle.opponentFlag,
      level: battle.opponentLevel,
      imageUrl: battle.opponentImageUrl,
      isBot: battle.isBot,
    },
    rewards:
      battle.status === "finished"
        ? {
            gems: battle.gemsEarned,
            xp: battle.xpEarned,
            trophies: battle.trophiesDelta,
          }
        : null,
  };
}
