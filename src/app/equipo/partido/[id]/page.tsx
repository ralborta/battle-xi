import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toTeamMatchView } from "@/lib/team-match-service";
import { redirect } from "next/navigation";
import { PartidoClient } from "./PartidoClient";

export default async function PartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const match = await prisma.teamMatch.findFirst({
    where: { id, userId: user.id },
  });
  if (!match) redirect("/equipo");

  return (
    <>
      <PageShell title="Partido" subtitle="Fútbol 5 · Mirás al rival y después arriesgás">
        <PartidoClient initial={toTeamMatchView(match)} />
      </PageShell>
      <BottomNav />
    </>
  );
}
