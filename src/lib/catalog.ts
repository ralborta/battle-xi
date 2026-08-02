import "server-only";

import type { CardSource, PlayerTemplate, Prisma, User } from "@/generated/prisma/client";
import { avatarForSlug, CATALOG_SEED } from "@/lib/catalog-data";
import { prisma } from "@/lib/db";
import { PACK_COST_GEMS, PACK_SIZE, STARTER_CARD_COUNT } from "@/lib/futbol5";

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** Sincroniza avatares del catálogo (y cartas ligadas) cuando cambian los assets. */
async function syncCatalogAvatars(): Promise<void> {
  const templates = await prisma.playerTemplate.findMany({
    select: { id: true, slug: true, imageUrl: true },
  });

  for (const t of templates) {
    const next = avatarForSlug(t.slug);
    if (t.imageUrl === next) continue;
    await prisma.$transaction([
      prisma.playerTemplate.update({ where: { id: t.id }, data: { imageUrl: next } }),
      prisma.card.updateMany({
        where: { templateId: t.id, source: { in: ["starter", "pack"] } },
        data: { imageUrl: next },
      }),
    ]);
  }
}

export async function ensureCatalogSeeded(): Promise<number> {
  const existing = await prisma.playerTemplate.count();
  if (existing > 0) {
    // Solo reescribe imágenes si todavía hay el placeholder viejo.
    const stale = await prisma.playerTemplate.count({
      where: {
        OR: [
          { imageUrl: { contains: "player-default" } },
          { imageUrl: { endsWith: ".svg" } },
        ],
      },
    });
    if (stale > 0) await syncCatalogAvatars();
    return existing;
  }

  await prisma.playerTemplate.createMany({
    data: CATALOG_SEED.map((p) => ({
      slug: p.slug,
      playerName: p.playerName,
      countryCode: p.countryCode,
      countryFlag: p.countryFlag,
      position: p.position,
      compatible: p.compatible,
      rarity: p.rarity,
      rating: p.rating,
      ability: p.ability,
      imageUrl: avatarForSlug(p.slug),
      vel: p.vel,
      tir: p.tir,
      pas: p.pas,
      reg: p.reg,
      def: p.def,
      fis: p.fis,
      published: true,
    })),
  });

  return CATALOG_SEED.length;
}

function cardFromTemplate(
  userId: string,
  template: PlayerTemplate,
  source: CardSource,
): Prisma.CardCreateManyInput {
  return {
    userId,
    source,
    templateId: template.id,
    playerName: template.playerName,
    position: template.position,
    rarity: template.rarity,
    rating: template.rating,
    ability: template.ability,
    countryFlag: template.countryFlag,
    imageUrl: template.imageUrl,
    vel: template.vel,
    tir: template.tir,
    pas: template.pas,
    reg: template.reg,
    def: template.def,
    fis: template.fis,
  };
}

/** Regalo de arranque: cartas del catálogo equilibradas por puesto. */
export async function grantStarterCards(userId: string): Promise<number> {
  await ensureCatalogSeeded();

  const already = await prisma.card.count({
    where: { userId, source: "starter" },
  });
  if (already > 0) return 0;

  const all = await prisma.playerTemplate.findMany({ where: { published: true } });
  const byPos = {
    POR: all.filter((t) => t.position === "POR"),
    DEF: all.filter((t) => t.position === "DEF"),
    MC: all.filter((t) => t.position === "MC" || t.position === "DC"),
    DEL: all.filter((t) => t.position === "DEL" || t.position === "EXT"),
  };

  const chosen: PlayerTemplate[] = [
    ...pickRandom(byPos.POR, 2),
    ...pickRandom(byPos.DEF, 2),
    ...pickRandom(byPos.MC, 3),
    ...pickRandom(byPos.DEL, 3),
  ];

  // Completar hasta STARTER_CARD_COUNT si faltó por catálogo chico.
  const rest = all.filter((t) => !chosen.some((c) => c.id === t.id));
  chosen.push(...pickRandom(rest, Math.max(0, STARTER_CARD_COUNT - chosen.length)));

  await prisma.card.createMany({
    data: chosen.slice(0, STARTER_CARD_COUNT).map((t) => cardFromTemplate(userId, t, "starter")),
  });

  return Math.min(STARTER_CARD_COUNT, chosen.length);
}

export async function openPack(user: User): Promise<{ cards: Awaited<ReturnType<typeof prisma.card.findMany>>; gems: number }> {
  await ensureCatalogSeeded();

  if (user.gems < PACK_COST_GEMS) {
    throw Object.assign(new Error("Te faltan gemas para abrir el sobre"), { status: 409 });
  }

  const templates = await prisma.playerTemplate.findMany({ where: { published: true } });
  if (templates.length < PACK_SIZE) {
    throw Object.assign(new Error("El catálogo todavía no tiene suficientes fichas"), { status: 503 });
  }

  const picked = pickRandom(templates, PACK_SIZE);

  const [, , cards] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { gems: { decrement: PACK_COST_GEMS } },
    }),
    prisma.card.createMany({
      data: picked.map((t) => cardFromTemplate(user.id, t, "pack")),
    }),
    prisma.card.findMany({
      where: { userId: user.id, source: "pack" },
      orderBy: { createdAt: "desc" },
      take: PACK_SIZE,
    }),
  ]);

  return { cards, gems: user.gems - PACK_COST_GEMS };
}
