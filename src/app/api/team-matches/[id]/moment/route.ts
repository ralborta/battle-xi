import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { PlayType } from "@/lib/futbol5";
import { PLAY_COST } from "@/lib/futbol5";
import { TeamGameError, playTeamMoment, toTeamMatchView } from "@/lib/team-match-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { playType?: string } | null;
  const playType = body?.playType as PlayType | undefined;

  if (!playType || !(playType in PLAY_COST)) {
    return NextResponse.json({ error: "Elegí seguro, combinado o total" }, { status: 400 });
  }

  try {
    const match = await playTeamMoment(user, id, playType);
    return NextResponse.json({ match: toTeamMatchView(match) });
  } catch (error) {
    if (error instanceof TeamGameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
