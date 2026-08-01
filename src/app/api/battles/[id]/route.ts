import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GameError, getBattle, toBattleView } from "@/lib/battle-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Entrá a tu cuenta para jugar" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const battle = await getBattle(user.id, id);
    return NextResponse.json({ battle: toBattleView(battle) });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
