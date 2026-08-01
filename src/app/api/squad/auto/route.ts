import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { autoFillFutbol5 } from "@/lib/squad-service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const squad = await autoFillFutbol5(user.id);
  return NextResponse.json({ squad });
}
