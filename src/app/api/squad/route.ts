import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { F5_SLOTS, type F5Slot } from "@/lib/futbol5";
import { getOrCreateFutbol5Squad, updateSquadLineup } from "@/lib/squad-service";
import type { TeamStyle } from "@/generated/prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const squad = await getOrCreateFutbol5Squad(user.id);
  return NextResponse.json({ squad });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    slots?: Partial<Record<F5Slot, string | null>>;
    style?: TeamStyle;
    captainSlot?: F5Slot | null;
  } | null;

  const slots = body?.slots;
  if (!slots || typeof slots !== "object") {
    return NextResponse.json({ error: "Mandá la alineación" }, { status: 400 });
  }

  for (const key of Object.keys(slots)) {
    if (!(F5_SLOTS as readonly string[]).includes(key)) {
      return NextResponse.json({ error: `Puesto inválido: ${key}` }, { status: 400 });
    }
  }

  try {
    const squad = await updateSquadLineup(user.id, {
      slots,
      style: body?.style,
      captainSlot: body?.captainSlot,
    });
    return NextResponse.json({ squad });
  } catch (error) {
    const err = error as Error & { status?: number };
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    );
  }
}
