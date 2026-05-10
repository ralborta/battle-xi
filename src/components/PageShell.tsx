import { cn } from "@/lib/cn";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  back?: string;
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function PageShell({
  title,
  subtitle,
  back,
  children,
  className,
  hideNav,
}: PageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium-soft">
      <div className="absolute inset-0 grid-arena opacity-20 pointer-events-none" />

      <div className={cn("relative z-10 max-w-md mx-auto px-5 pt-6", hideNav ? "pb-10" : "pb-32", className)}>
        <div className="flex items-center gap-3 mb-6">
          {back && (
            <Link
              href={back}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-border-soft hover:bg-white/10 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
          )}
          <div className="flex-1">
            <h1
              className="font-display text-3xl tracking-wide leading-none"
              style={{
                color: "#fff",
                textShadow: "0 0 12px rgba(34,211,238,0.45)",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-text-tertiary font-body">{subtitle}</p>
            )}
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
