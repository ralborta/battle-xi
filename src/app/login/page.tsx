import { BattleLogo } from "@/components/BattleLogo";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 grid-arena opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <BattleLogo size="md" />
        </div>

        <div className="rounded-3xl border border-border-soft bg-white/5 backdrop-blur-xl p-6">
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
                placeholder="ej. ElPibe10"
                className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Email del adulto
              </span>
              <input
                type="email"
                placeholder="mama@ejemplo.com"
                className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
              />
            </label>
          </div>

          <Link href="/jugar" className="block mt-6">
            <Button variant="cyan" size="lg" fullWidth>
              Entrar
            </Button>
          </Link>

          <Link
            href="/onboarding"
            className="block mt-4 text-center text-sm text-cyan-300/90 hover:text-cyan-200 font-body transition"
          >
            ¿Primera vez? Creá tu cuenta y activá la cámara
          </Link>

          <p className="mt-4 text-center text-[11px] text-text-muted">
            Pedimos email del adulto solo para recuperar tu cuenta.
          </p>
        </div>

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
