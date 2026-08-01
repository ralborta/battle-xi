-- CreateEnum
CREATE TYPE "CardSource" AS ENUM ('scan', 'pack', 'starter');

-- CreateEnum
CREATE TYPE "SquadMode" AS ENUM ('futbol5');

-- CreateEnum
CREATE TYPE "TeamMatchStatus" AS ENUM ('active', 'finished');

-- CreateEnum
CREATE TYPE "TeamStyle" AS ENUM ('ataque', 'equilibrio', 'defensa');

-- CreateTable
CREATE TABLE "PlayerTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryFlag" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "compatible" JSONB NOT NULL DEFAULT '[]',
    "rarity" "Rarity" NOT NULL,
    "rating" INTEGER NOT NULL,
    "ability" TEXT NOT NULL DEFAULT 'none',
    "imageUrl" TEXT NOT NULL DEFAULT '/avatars/player-default.svg',
    "vel" INTEGER NOT NULL,
    "tir" INTEGER NOT NULL,
    "pas" INTEGER NOT NULL,
    "reg" INTEGER NOT NULL,
    "def" INTEGER NOT NULL,
    "fis" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerTemplate_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "source" "CardSource" NOT NULL DEFAULT 'scan';
ALTER TABLE "Card" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Card" ADD COLUMN "ability" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "SquadMode" NOT NULL DEFAULT 'futbol5',
    "style" "TeamStyle" NOT NULL DEFAULT 'equilibrio',
    "captainSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadSlot" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "cardId" TEXT,

    CONSTRAINT "SquadSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TeamMatchStatus" NOT NULL DEFAULT 'active',
    "result" "BattleResult",
    "styleUser" "TeamStyle" NOT NULL DEFAULT 'equilibrio',
    "styleBot" "TeamStyle" NOT NULL DEFAULT 'equilibrio',
    "impulseLeft" INTEGER NOT NULL DEFAULT 100,
    "scoreUser" INTEGER NOT NULL DEFAULT 0,
    "scoreOpponent" INTEGER NOT NULL DEFAULT 0,
    "momentIndex" INTEGER NOT NULL DEFAULT 0,
    "lineupUser" JSONB NOT NULL,
    "lineupBot" JSONB NOT NULL,
    "moments" JSONB NOT NULL DEFAULT '[]',
    "seed" TEXT NOT NULL,
    "gemsEarned" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "trophiesDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "TeamMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerTemplate_slug_key" ON "PlayerTemplate"("slug");
CREATE INDEX "PlayerTemplate_published_position_idx" ON "PlayerTemplate"("published", "position");
CREATE INDEX "PlayerTemplate_countryCode_idx" ON "PlayerTemplate"("countryCode");

CREATE INDEX "Card_userId_source_idx" ON "Card"("userId", "source");
CREATE INDEX "Card_templateId_idx" ON "Card"("templateId");

CREATE UNIQUE INDEX "Squad_userId_mode_key" ON "Squad"("userId", "mode");
CREATE UNIQUE INDEX "SquadSlot_squadId_slotKey_key" ON "SquadSlot"("squadId", "slotKey");
CREATE INDEX "SquadSlot_cardId_idx" ON "SquadSlot"("cardId");

CREATE INDEX "TeamMatch_userId_createdAt_idx" ON "TeamMatch"("userId", "createdAt");
CREATE INDEX "TeamMatch_userId_status_idx" ON "TeamMatch"("userId", "status");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PlayerTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadSlot" ADD CONSTRAINT "SquadSlot_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadSlot" ADD CONSTRAINT "SquadSlot_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamMatch" ADD CONSTRAINT "TeamMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
