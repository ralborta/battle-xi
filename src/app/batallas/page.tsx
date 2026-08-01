import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ENERGY_PER_BATTLE, currentEnergy } from "@/lib/game";
import { Clock, Swords, Users, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const MODES = [
  {
    title: "Batalla Rápida",
    desc: "Duelo 1 vs 1 contra la carta de otro club",
    reward: `+150 XP · 25 gemas · cuesta ${ENERGY_PER_BATTLE} de energía`,
    icon: Zap,
    variant: "cyan" as const,
    accent: "from-cyan-400/20 to-cyan-600/10",
    href: "/batallas/nueva",
  },
  {
    title: "Reto del Día",
    desc: "Misión diaria con recompensa especial",
    reward: "Pack rareza Rara garantizado",
    icon: Clock,
    variant: "violet" as const,
    accent: "from-violet-500/20 to-violet-700/10",
    href: null,
  },
  {
    title: "Equipo vs Equipo",
    desc: "Tu XI completo contra otro XI",
    reward: "+400 XP · 80 gemas",
    icon: Users,
    variant: "gold" as const,
    accent: "from-amber-400/20 to-amber-600/10",
    href: null,
  },
];

export default async function BatallasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const active = await prisma.battle.findFirst({
    where: { userId: user.id, status: "active" },
    select: { id: true },
  });
  const { energy } = currentEnergy(user.energy, user.energyUpdatedAt);

  const stats = [
    { label: "Victorias", value: user.wins, color: "#22d3ee" },
    { label: "Racha", value: user.streak, color: "#fbbf24" },
    { label: "Trofeos", value: user.trophies, color: "#a855f7" },
  ];

  return (
    <>
      <PageShell title="Batallas" subtitle={`Energía ${energy}/20`}>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border-soft bg-white/5 backdrop-blur-md p-3 text-center"
            >
              <div
                className="font-display text-2xl leading-none"
                style={{ color: s.color, textShadow: `0 0 10px ${s.color}80` }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[10px] font-display tracking-wider uppercase text-text-tertiary">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {active && (
          <Link href={`/batallas/${active.id}`} className="block mb-5">
            <div className="rounded-2xl border border-cyan-400/50 bg-cyan-400/10 p-4 text-center">
              <p className="font-display text-lg text-cyan-100">Tenés un duelo sin terminar</p>
              <p className="mt-1 text-xs text-text-tertiary font-body">
                Tocá acá para volver a la cancha
              </p>
            </div>
          </Link>
        )}

        <div className="space-y-4">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className={`relative overflow-hidden rounded-2xl border border-border-soft bg-gradient-to-br ${m.accent} p-4`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{
                      background:
                        m.variant === "cyan"
                          ? "linear-gradient(135deg,#22d3ee,#0891b2)"
                          : m.variant === "violet"
                            ? "linear-gradient(135deg,#a78bfa,#7c3aed)"
                            : "linear-gradient(135deg,#fde68a,#f59e0b)",
                      boxShadow:
                        m.variant === "cyan"
                          ? "0 0 16px rgba(34,211,238,0.5)"
                          : m.variant === "violet"
                            ? "0 0 16px rgba(139,92,246,0.5)"
                            : "0 0 16px rgba(251,191,36,0.5)",
                    }}
                  >
                    <Icon className="w-6 h-6 text-bg-void" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg leading-tight text-text-primary">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-text-tertiary">{m.desc}</p>
                    <p className="mt-2 text-[11px] font-display tracking-wider uppercase text-cyan-200">
                      {m.reward}
                    </p>
                  </div>
                </div>
                {m.href ? (
                  <Link href={m.href} className="block mt-4">
                    <Button
                      variant={m.variant}
                      size="md"
                      fullWidth
                      icon={<Swords className="w-4 h-4" />}
                    >
                      Competir
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="md" fullWidth className="mt-4" disabled>
                    Muy pronto
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
