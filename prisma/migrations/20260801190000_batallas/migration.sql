-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('active', 'finished');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('win', 'loss', 'draw');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "draws" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "energy" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "energyUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trophies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "gems" SET DEFAULT 50;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "opponentUserId" TEXT,
    "opponentCardId" TEXT,
    "opponentNickname" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "opponentPosition" "Position" NOT NULL,
    "opponentRarity" "Rarity" NOT NULL,
    "opponentRating" INTEGER NOT NULL,
    "opponentLevel" INTEGER NOT NULL,
    "opponentFlag" TEXT NOT NULL,
    "opponentImageUrl" TEXT,
    "opponentVel" INTEGER NOT NULL,
    "opponentTir" INTEGER NOT NULL,
    "opponentPas" INTEGER NOT NULL,
    "opponentReg" INTEGER NOT NULL,
    "opponentDef" INTEGER NOT NULL,
    "opponentFis" INTEGER NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "status" "BattleStatus" NOT NULL DEFAULT 'active',
    "result" "BattleResult",
    "scoreUser" INTEGER NOT NULL DEFAULT 0,
    "scoreOpponent" INTEGER NOT NULL DEFAULT 0,
    "rounds" JSONB NOT NULL DEFAULT '[]',
    "seed" TEXT NOT NULL,
    "gemsEarned" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "trophiesDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Battle_userId_createdAt_idx" ON "Battle"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Battle_userId_status_idx" ON "Battle"("userId", "status");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentUserId_fkey" FOREIGN KEY ("opponentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentCardId_fkey" FOREIGN KEY ("opponentCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

