import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startTeamMatch, toTeamMatchView } from "@/lib/team-match-service";
import type { TeamStyle } from "@/generated/prisma/client";

const STYLES: TeamStyle[] = ["ataque", "equilibrio", "defensa"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { style?: string } | null;
  const style =
    body?.style && STYLES.includes(body.style as TeamStyle)
      ? (body.style as TeamStyle)
      : undefined;

  const { match, created } = await startTeamMatch(user, style);
  return NextResponse.json(
    { match: toTeamMatchView(match) },
    { status: created ? 201 : 200 },
  );
}
