import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toTeamMatchView } from "@/lib/team-match-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const { id } = await context.params;
  const match = await prisma.teamMatch.findFirst({
    where: { id, userId: user.id },
  });
  if (!match) return NextResponse.json({ error: "No encontramos ese partido" }, { status: 404 });

  return NextResponse.json({ match: toTeamMatchView(match) });
}
