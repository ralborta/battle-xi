import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, normalizeNickname, startSession } from "@/lib/auth";
import { parseEmail, parseNickname, parsePin } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { nickname, parentEmail, pin } = body as Record<string, unknown>;

  const validNickname = parseNickname(nickname);
  const validEmail = parseEmail(parentEmail);
  const validPin = parsePin(pin);

  if (!validNickname) {
    return NextResponse.json({ error: "El apodo tiene que tener entre 2 y 24 letras" }, { status: 400 });
  }
  if (!validEmail) {
    return NextResponse.json({ error: "Necesitamos un email válido del adulto" }, { status: 400 });
  }
  if (!validPin) {
    return NextResponse.json({ error: "El PIN tiene que ser de 4 números" }, { status: 400 });
  }

  const nicknameKey = normalizeNickname(validNickname);
  const taken = await prisma.user.findUnique({ where: { nicknameKey } });
  if (taken) {
    return NextResponse.json({ error: "Ese apodo ya está ocupado, probá otro" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      nickname: validNickname,
      nicknameKey,
      parentEmail: validEmail,
      pinHash: hashPin(validPin),
      lastLoginAt: new Date(),
    },
  });

  await startSession(user.id);

  return NextResponse.json({
    user: { id: user.id, nickname: user.nickname, gems: user.gems },
  });
}
