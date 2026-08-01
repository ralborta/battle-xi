import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCard, isPosition } from "@/lib/card-generator";
import { prisma } from "@/lib/db";
import { uploadImage } from "@/lib/storage";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Entrá a tu cuenta para escanear" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");

  if (!form || !(image instanceof File)) {
    return NextResponse.json({ error: "No recibimos la foto" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(image.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 415 });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto es demasiado pesada" }, { status: 413 });
  }

  const playerName = String(form.get("playerName") ?? "").trim();
  if (playerName.length < 2 || playerName.length > 32) {
    return NextResponse.json({ error: "Escribí el nombre del jugador" }, { status: 400 });
  }

  const rawPosition = String(form.get("position") ?? "");
  if (!isPosition(rawPosition)) {
    return NextResponse.json({ error: "Elegí una posición válida" }, { status: 400 });
  }

  const countryFlag = String(form.get("countryFlag") ?? "🇦🇷").slice(0, 8);
  const ocrText = String(form.get("ocrText") ?? "").slice(0, 2000) || null;

  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const key = `scans/${user.id}/${randomUUID()}.${extension}`;
  const imageUrl = await uploadImage(
    key,
    Buffer.from(await image.arrayBuffer()),
    image.type,
  );

  const scan = await prisma.scan.create({
    data: {
      userId: user.id,
      imageKey: key,
      imageUrl,
      ocrText,
      detectedName: playerName,
      status: "confirmed",
    },
  });

  const generated = generateCard(scan.id, rawPosition);

  const card = await prisma.card.create({
    data: {
      userId: user.id,
      scanId: scan.id,
      playerName,
      position: rawPosition,
      countryFlag,
      imageUrl,
      ...generated,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}
