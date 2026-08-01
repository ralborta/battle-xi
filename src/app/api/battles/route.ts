import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GameError, startBattle, toBattleView } from "@/lib/battle-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Entrá a tu cuenta para jugar" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { cardId?: unknown } | null;
  const cardId = typeof body?.cardId === "string" ? body.cardId : null;
  if (!cardId) {
    return NextResponse.json({ error: "Elegí con qué carta jugás" }, { status: 400 });
  }

  try {
    const battle = await startBattle(user, cardId);
    return NextResponse.json({ battle: toBattleView(battle) }, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
