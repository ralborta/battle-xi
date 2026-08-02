"use client";

import { Button } from "@/components/Button";
import {
  SLOT_LABELS,
  type F5Slot,
  type PlayType,
  ZONE_LABELS,
} from "@/lib/futbol5";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PublicPlayer = {
  slot: F5Slot;
  name: string;
  position: string;
  rarity: string;
  rating: number;
  flag: string;
  imageUrl: string | null;
  isAcademy: boolean;
};

type SlotDuel = {
  slot: F5Slot;
  userName: string;
  botName: string;
  userPower: number;
  botPower: number;
  userPoints: number;
  botPoints: number;
  winner: string;
  why?: string;
};

type TeamValues = {
  ataque: number;
  mediocampo: number;
  defensa: number;
  arquero: number;
  equilibrio: number;
};

type PlayOption = {
  playType: PlayType;
  cost: number;
  label: string;
  risk: string;
  ifWin: string;
  ifLose: string;
  canAfford: boolean;
  approxWinPoints: number;
};

type MatchView = {
  id: string;
  status: "active" | "finished";
  result: "win" | "loss" | "draw" | null;
  impulseLeft: number;
  scoreUser: number;
  scoreOpponent: number;
  momentIndex: number;
  momentsTotal: number;
  momentLabel: string;
  momentHelp: string;
  activeZone: string;
  activeSlots: F5Slot[];
  styleUser: string;
  styleBot: string;
  connection: number;
  youValues: TeamValues;
  rivalValues: TeamValues;
  yourZonePower: number;
  rivalPlay: {
    playType: PlayType;
    label: string;
    cost: number;
    risk: string;
    ifWin: string;
    zonePower: number;
  } | null;
  playOptions: PlayOption[];
  moments: Array<{
    label: string;
    playType: string;
    botPlayType?: string;
    userPower: number;
    botPower: number;
    userPoints: number;
    botPoints: number;
    winner: string;
    hint: string;
    why?: string;
    duels?: SlotDuel[];
  }>;
  you: PublicPlayer[];
  rival: PublicPlayer[];
  rewards: { gems: number; xp: number; trophies: number } | null;
};

type StyleOpt = "ataque" | "equilibrio" | "defensa";

export function PartidoClient({ initial }: { initial: MatchView }) {
  const router = useRouter();
  const [match, setMatch] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleOpt>(
    (initial.styleUser as StyleOpt) || "equilibrio",
  );
  const [swapA, setSwapA] = useState<F5Slot | null>(null);
  const [pendingSwap, setPendingSwap] = useState<[F5Slot, F5Slot] | null>(null);
  const [step, setStep] = useState<"rival" | "you">("rival");

  const lastMoment = match.moments[match.moments.length - 1];

  const play = async (playType: PlayType) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-matches/${match.id}/moment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playType,
          style,
          swap: pendingSwap ?? undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo jugar el momento");
        return;
      }
      setMatch(data.match);
      setPendingSwap(null);
      setSwapA(null);
      setStep("rival");
      setStyle((data.match.styleUser as StyleOpt) || style);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const onTapSlot = (slot: F5Slot) => {
    if (!swapA) {
      setSwapA(slot);
      return;
    }
    if (swapA === slot) {
      setSwapA(null);
      return;
    }
    setPendingSwap([swapA, slot]);
    setSwapA(null);
  };

  const youBySlot = useMemo(
    () => new Map(match.you.map((p) => [p.slot, p])),
    [match.you],
  );

  if (match.status === "finished") {
    const title =
      match.result === "win"
        ? "¡Ganaste el partido!"
        : match.result === "loss"
          ? "Esta vez no fue"
          : "Empate";
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-transparent p-6">
          <p className="font-display text-3xl text-text-primary">{title}</p>
          <p className="mt-2 font-display text-4xl text-cyan-200">
            {match.scoreUser} — {match.scoreOpponent}
          </p>
          <p className="mt-2 text-sm text-text-tertiary">
            Se gana sumando más puntos en los duelos de puesto a lo largo del partido.
          </p>
          {match.rewards && (
            <p className="mt-3 text-sm text-text-tertiary font-body">
              +{match.rewards.gems} gemas · +{match.rewards.xp} XP ·{" "}
              {match.rewards.trophies >= 0 ? "+" : ""}
              {match.rewards.trophies} trofeos
            </p>
          )}
        </div>

        <div className="text-left space-y-2">
          <h2 className="font-display text-sm text-text-secondary">Cómo se jugó</h2>
          {match.moments.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                m.winner === "user"
                  ? "border-cyan-400/40 bg-cyan-400/10"
                  : m.winner === "bot"
                    ? "border-violet-400/40 bg-violet-400/10"
                    : "border-border-soft bg-white/5",
              )}
            >
              <div className="font-display">{m.label}</div>
              <p className="text-[11px] text-text-tertiary mt-1">{m.why ?? m.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/equipo">
            <Button variant="ghost" size="md" fullWidth>
              Mi equipo
            </Button>
          </Link>
          <Link href="/ranking">
            <Button variant="cyan" size="md" fullWidth>
              Ver puntos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeSet = new Set(match.activeSlots);

  return (
    <div className="space-y-4">
      {/* Marcador */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-border-soft bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Vos</div>
          <div className="font-display text-2xl text-cyan-200">{match.scoreUser}</div>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
            Impulso
          </div>
          <div className="font-display text-2xl text-amber-300">{match.impulseLeft}</div>
          <div className="text-[9px] text-text-muted">energía del partido</div>
        </div>
        <div className="rounded-2xl border border-border-soft bg-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Rival</div>
          <div className="font-display text-2xl text-violet-200">{match.scoreOpponent}</div>
        </div>
      </div>

      {/* Valores del equipo */}
      <ValuesPanel title="Tus valores" values={match.youValues} accent="cyan" />
      <ValuesPanel title="Valores rival" values={match.rivalValues} accent="violet" />

      {/* Momento */}
      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
        <p className="text-[11px] font-display tracking-widest uppercase text-cyan-200/80 text-center">
          Turno {match.momentIndex + 1}/{match.momentsTotal} ·{" "}
          {ZONE_LABELS[match.activeZone as keyof typeof ZONE_LABELS] ?? match.activeZone}
        </p>
        <p className="mt-1 font-display text-2xl text-text-primary text-center">
          {match.momentLabel}
        </p>
        <p className="mt-2 text-xs text-text-tertiary text-center">{match.momentHelp}</p>
        <p className="mt-2 text-[11px] text-text-muted text-center">
          Pelean: {match.activeSlots.map((s) => SLOT_LABELS[s]).join(" · ")} · Poder zona{" "}
          {match.yourZonePower} vs {match.rivalPlay?.zonePower ?? "—"}
        </p>
      </div>

      {lastMoment?.why && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-xs",
            lastMoment.winner === "user"
              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
              : lastMoment.winner === "bot"
                ? "border-violet-400/40 bg-violet-400/10 text-violet-100"
                : "border-border-soft bg-white/5 text-text-secondary",
          )}
        >
          <p className="font-display text-sm mb-1">Último turno</p>
          <p>{lastMoment.why}</p>
          {lastMoment.duels?.map((d) => (
            <p key={d.slot} className="mt-1 text-text-tertiary">
              {d.why ?? `${SLOT_LABELS[d.slot]}: ${d.userPower} vs ${d.botPower}`}
            </p>
          ))}
        </div>
      )}

      {/* Paso 1: rival */}
      {step === "rival" && match.rivalPlay && (
        <div className="rounded-2xl border border-violet-400/40 bg-violet-500/10 p-4 space-y-3">
          <p className="text-[11px] font-display tracking-widest uppercase text-violet-200/80">
            1 · El rival ya eligió
          </p>
          <p className="font-display text-xl text-text-primary">
            {match.rivalPlay.label}
          </p>
          <p className="text-sm text-text-secondary">
            Arriesga <span className="text-amber-200 font-display">{match.rivalPlay.cost}</span>{" "}
            de impulso · riesgo {match.rivalPlay.risk}
          </p>
          <p className="text-xs text-text-tertiary">{match.rivalPlay.ifWin} si gana los duelos.</p>
          <p className="text-xs text-text-muted">
            Estilo rival: {match.styleBot}. Ahora te toca responder.
          </p>
          <Button variant="cyan" size="md" fullWidth onClick={() => setStep("you")}>
            Ver mi jugada
          </Button>
        </div>
      )}

      {/* Paso 2: vos */}
      {step === "you" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-4 space-y-3">
            <p className="text-[11px] font-display tracking-widest uppercase text-cyan-200/80">
              2 · Tu turno · ¿cuánto arriesgás?
            </p>
            <p className="text-xs text-text-tertiary">
              El impulso que pongas se gasta. Si ganás los duelos de puesto, sumás puntos
              según lo arriesgado. Si perdés, el rival suma según lo que él arriesgó.
            </p>

            <div>
              <p className="text-[11px] text-text-tertiary mb-2">Estrategia del equipo</p>
              <div className="grid grid-cols-3 gap-2">
                {(["ataque", "equilibrio", "defensa"] as StyleOpt[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={cn(
                      "h-10 rounded-xl text-[11px] font-display uppercase border",
                      style === s
                        ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-100"
                        : "bg-white/5 border-border-soft text-text-tertiary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                Ataque sube el frente · Defensa el fondo · Equilibrio balancea.
              </p>
            </div>

            <div>
              <p className="text-[11px] text-text-tertiary mb-2">
                Mover fichas (tocá dos puestos para intercambiar)
              </p>
              <div className="grid grid-cols-5 gap-1">
                {(["POR", "DEF", "MC1", "MC2", "DEL"] as F5Slot[]).map((slot) => {
                  const p = youBySlot.get(slot);
                  const selected = swapA === slot;
                  const inSwap =
                    pendingSwap &&
                    (pendingSwap[0] === slot || pendingSwap[1] === slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onTapSlot(slot)}
                      className={cn(
                        "rounded-lg border px-1 py-2 text-center",
                        selected || inSwap
                          ? "border-amber-400/60 bg-amber-400/15"
                          : activeSet.has(slot)
                            ? "border-cyan-400/40 bg-cyan-400/10"
                            : "border-white/10 bg-black/20",
                      )}
                    >
                      <div className="text-[9px] text-text-tertiary">{SLOT_LABELS[slot]}</div>
                      <div className="font-mono text-xs text-amber-200">{p?.rating}</div>
                    </button>
                  );
                })}
              </div>
              {pendingSwap && (
                <p className="mt-1 text-[11px] text-amber-200">
                  Vas a intercambiar {SLOT_LABELS[pendingSwap[0]]} ↔{" "}
                  {SLOT_LABELS[pendingSwap[1]]} al jugar.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => setPendingSwap(null)}
                  >
                    Cancelar
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <LineupMini title="Vos" players={match.you} active={activeSet} accent="cyan" />
            <LineupMini title="Rival" players={match.rival} active={activeSet} accent="violet" />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="space-y-2">
            {match.playOptions.map((opt) => (
              <button
                key={opt.playType}
                type="button"
                disabled={busy || !opt.canAfford}
                onClick={() => void play(opt.playType)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left transition disabled:opacity-40",
                  opt.playType === "total"
                    ? "border-amber-400/40 bg-amber-400/10"
                    : opt.playType === "combinado"
                      ? "border-violet-400/40 bg-violet-400/10"
                      : "border-cyan-400/40 bg-cyan-400/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base text-text-primary">{opt.label}</span>
                  <span className="font-display text-amber-200">
                    −{opt.cost} impulso
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-text-tertiary">
                  Riesgo {opt.risk} · Si ganás ≈ +{opt.approxWinPoints} pts · {opt.ifWin}
                </div>
                <div className="text-[11px] text-text-muted">{opt.ifLose}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="w-full text-xs text-text-tertiary underline"
            onClick={() => setStep("rival")}
          >
            Volver a ver al rival
          </button>
        </div>
      )}
    </div>
  );
}

function ValuesPanel({
  title,
  values,
  accent,
}: {
  title: string;
  values: TeamValues;
  accent: "cyan" | "violet";
}) {
  const items: Array<{ key: keyof TeamValues; label: string }> = [
    { key: "ataque", label: "Ataque" },
    { key: "mediocampo", label: "Medio" },
    { key: "defensa", label: "Defensa" },
    { key: "arquero", label: "Arquero" },
    { key: "equilibrio", label: "Equil." },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border px-2 py-2",
        accent === "cyan" ? "border-cyan-400/20 bg-cyan-400/5" : "border-violet-400/20 bg-violet-400/5",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1 px-1">
        {title}
      </p>
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <div key={item.key} className="rounded-lg bg-black/25 px-1 py-1.5 text-center">
            <div className="text-[9px] text-text-muted">{item.label}</div>
            <div
              className={cn(
                "font-display text-sm",
                accent === "cyan" ? "text-cyan-200" : "text-violet-200",
              )}
            >
              {item.key === "equilibrio" ? `+${values[item.key]}%` : values[item.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineupMini({
  title,
  players,
  active,
  accent,
}: {
  title: string;
  players: PublicPlayer[];
  active: Set<F5Slot>;
  accent: "cyan" | "violet";
}) {
  const order: F5Slot[] = ["DEL", "MC1", "MC2", "DEF", "POR"];
  const bySlot = new Map(players.map((p) => [p.slot, p]));

  return (
    <div
      className={cn(
        "rounded-xl border p-2 space-y-1",
        accent === "cyan" ? "border-cyan-400/20" : "border-violet-400/20",
      )}
    >
      <p className="text-[10px] uppercase text-text-tertiary">{title}</p>
      {order.map((slot) => {
        const p = bySlot.get(slot);
        if (!p) return null;
        return (
          <div
            key={slot}
            className={cn(
              "flex justify-between text-[11px] px-1 py-0.5 rounded",
              active.has(slot) ? "bg-white/10" : "opacity-50",
            )}
          >
            <span className="truncate">
              {SLOT_LABELS[slot].slice(0, 3)} {p.name.split(" ").slice(-1)[0]}
            </span>
            <span className="font-mono text-amber-200">{p.rating}</span>
          </div>
        );
      })}
    </div>
  );
}
