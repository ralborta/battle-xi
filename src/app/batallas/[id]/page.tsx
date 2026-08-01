import { getCurrentUser } from "@/lib/auth";
import { GameError, getBattle, toBattleView } from "@/lib/battle-service";
import { notFound, redirect } from "next/navigation";
import { DueloView } from "./DueloView";

export default async function BatallaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  try {
    const battle = await getBattle(user.id, id);
    return <DueloView initial={toBattleView(battle)} />;
  } catch (error) {
    if (error instanceof GameError) notFound();
    throw error;
  }
}
