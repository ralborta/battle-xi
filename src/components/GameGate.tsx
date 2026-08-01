"use client";

import { isOnboarded } from "@/lib/onboarding-storage";
import { BattleLogo } from "@/components/BattleLogo";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

export function GameGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          setAllowed(true);
          setReady(true);
          return;
        }
      } catch {
        // Sin red no podemos validar la sesión: lo mandamos a entrar de nuevo.
      }
      if (cancelled) return;
      setAllowed(false);
      setReady(true);
      // Si ya pasó por el onboarding en este teléfono, solo le falta volver a entrar.
      router.replace(isOnboarded() ? "/login" : "/onboarding");
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-stadium flex flex-col items-center justify-center gap-4">
        <BattleLogo size="sm" />
        <p className="font-body text-sm text-text-tertiary animate-pulse">
          Cargando tu club…
        </p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
