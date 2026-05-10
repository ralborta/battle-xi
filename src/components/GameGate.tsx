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
    if (isOnboarded()) {
      setAllowed(true);
      setReady(true);
      return;
    }
    setReady(true);
    setAllowed(false);
    router.replace("/onboarding");
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
