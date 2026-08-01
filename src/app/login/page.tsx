"use client";

import { BattleLogo } from "@/components/BattleLogo";
import { Button } from "@/components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = nickname.trim().length >= 2 && /^\d{4}$/.test(pin);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), pin }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error ?? "No pudimos entrar. Probá de nuevo.");
        return;
      }
      router.push("/jugar");
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y reintentá.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 grid-arena opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <BattleLogo size="md" />
        </div>

        <form
          className="rounded-3xl border border-border-soft bg-white/5 backdrop-blur-xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !submitting) void submit();
          }}
        >
          <h1 className="font-display text-2xl text-text-primary text-center">
            Entrar al juego
          </h1>
          <p className="mt-1 text-center text-sm text-text-tertiary">
            Tu equipo te está esperando
          </p>

          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Tu apodo
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ej. ElPibe10"
                maxLength={24}
                autoComplete="username"
                className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Tu PIN
              </span>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4 números"
                maxLength={4}
                autoComplete="current-password"
                className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body tracking-[0.5em] placeholder:tracking-normal placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-400 font-body">{error}</p>
          )}

          <Button
            type="submit"
            variant="cyan"
            size="lg"
            fullWidth
            className="mt-6"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Entrando…" : "Entrar"}
          </Button>

          <Link
            href="/onboarding"
            className="block mt-4 text-center text-sm text-cyan-300/90 hover:text-cyan-200 font-body transition"
          >
            ¿Primera vez? Creá tu cuenta y activá la cámara
          </Link>

          <p className="mt-4 text-center text-[11px] text-text-muted">
            Pedimos email del adulto solo para recuperar tu cuenta.
          </p>
        </form>

        <Link
          href="/"
          className="block mt-6 text-center text-sm text-text-tertiary hover:text-cyan-300 transition"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
