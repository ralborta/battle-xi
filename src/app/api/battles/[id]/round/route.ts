import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GameError, playRound, toBattleView } from "@/lib/battle-service";
import { isStatKey } from "@/lib/game";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Entrá a tu cuenta para jugar" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { stat?: unknown } | null;
  const stat = typeof body?.stat === "string" ? body.stat : "";

  if (!isStatKey(stat)) {
    return NextResponse.json({ error: "Elegí una habilidad válida" }, { status: 400 });
  }

  try {
    const battle = await playRound(user, id, stat);
    return NextResponse.json({ battle: toBattleView(battle) });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
