import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CollectionError, sellCard } from "@/lib/collection-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entrá a tu cuenta" }, { status: 401 });

  const { id } = await context.params;

  try {
    const result = await sellCard(user, id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CollectionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
