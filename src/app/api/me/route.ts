import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const cards = await prisma.card.count({ where: { userId: user.id } });

  return NextResponse.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      gems: user.gems,
      cards,
    },
  });
}
