import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeNickname, startSession, verifyPin } from "@/lib/auth";
import { clearFailures, isLockedOut, registerFailure } from "@/lib/rate-limit";
import { parseNickname, parsePin } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { nickname, pin } = body as Record<string, unknown>;
  const validNickname = parseNickname(nickname);
  const validPin = parsePin(pin);

  if (!validNickname || !validPin) {
    return NextResponse.json({ error: "Escribí tu apodo y tu PIN de 4 números" }, { status: 400 });
  }

  const nicknameKey = normalizeNickname(validNickname);

  if (isLockedOut(nicknameKey)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá unos minutos y volvé a probar." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { nicknameKey } });
  if (!user || !verifyPin(validPin, user.pinHash)) {
    registerFailure(nicknameKey);
    return NextResponse.json({ error: "Apodo o PIN incorrecto" }, { status: 401 });
  }

  clearFailures(nicknameKey);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(user.id);

  return NextResponse.json({
    user: { id: user.id, nickname: user.nickname, gems: user.gems },
  });
}
