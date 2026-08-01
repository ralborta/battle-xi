import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { Trophy3D } from "@/components/Trophy3D";
import { getCurrentUser } from "@/lib/auth";
import { Swords, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TorneosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageShell title="Torneos" subtitle="La copa se está preparando">
        <div className="relative flex flex-col items-center mb-2 pt-2">
          <Trophy3D size={200} />
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/12 to-amber-700/5 p-5 text-center">
          <p className="font-display text-2xl text-text-primary leading-tight">
            Todavía no hay torneos
          </p>
          <p className="mt-2 text-sm text-text-tertiary font-body">
            Estamos armando la copa semanal. Se va a jugar con los trofeos que ganás en las
            batallas, así que todo lo que sumes ahora te sirve cuando abra.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-border-soft px-4 py-2">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span className="font-display text-lg text-amber-300">{user.trophies}</span>
            <span className="text-[11px] uppercase tracking-widest text-text-tertiary">
              trofeos tuyos
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Link href="/batallas" className="block">
            <Button variant="cyan" size="lg" fullWidth icon={<Swords className="w-5 h-5" />}>
              Ir a batallar
            </Button>
          </Link>
          <Link href="/ranking" className="block">
            <Button variant="ghost" size="md" fullWidth>
              Ver el ranking
            </Button>
          </Link>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
