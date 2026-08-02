import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { F5Slot, PlayType, ZoneId } from "@/lib/futbol5";
import { F5_SLOTS, PLAY_COST } from "@/lib/futbol5";
import { TeamGameError, playTeamMoment, toTeamMatchView } from "@/lib/team-match-service";
import type { TeamStyle } from "@/generated/prisma/client";

const STYLES: TeamStyle[] = ["ataque", "equilibrio", "defensa"];
const ZONES: ZoneId[] = ["ataque", "mediocampo", "defensa"];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    playType?: string;
    style?: string;
    swap?: [string, string];
    reinforce?: string | null;
  } | null;

  const playType = body?.playType as PlayType | undefined;
  if (!playType || !(playType in PLAY_COST)) {
    return NextResponse.json(
      { error: "Elegí jugada segura, media o arriesgada" },
      { status: 400 },
    );
  }

  const style =
    body?.style && STYLES.includes(body.style as TeamStyle)
      ? (body.style as TeamStyle)
      : undefined;

  let swap: [F5Slot, F5Slot] | undefined;
  if (body?.swap) {
    const [a, b] = body.swap;
    if (
      !(F5_SLOTS as readonly string[]).includes(a) ||
      !(F5_SLOTS as readonly string[]).includes(b)
    ) {
      return NextResponse.json({ error: "Puestos inválidos para mover" }, { status: 400 });
    }
    swap = [a as F5Slot, b as F5Slot];
  }

  let reinforce: ZoneId | null | undefined = undefined;
  if (body && "reinforce" in body) {
    if (body.reinforce === null || body.reinforce === "") {
      reinforce = null;
    } else if (ZONES.includes(body.reinforce as ZoneId)) {
      reinforce = body.reinforce as ZoneId;
    } else {
      return NextResponse.json({ error: "Zona de refuerzo inválida" }, { status: 400 });
    }
  }

  try {
    const match = await playTeamMoment(user, id, {
      playType,
      style,
      swap,
      reinforce,
    });
    return NextResponse.json({ match: toTeamMatchView(match) });
  } catch (error) {
    if (error instanceof TeamGameError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
