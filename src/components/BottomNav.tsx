"use client";

import { cn } from "@/lib/cn";
import {
  UserSquare2,
  Swords,
  Trophy,
  BarChart3,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: typeof UserSquare2;
}

const ITEMS: NavItem[] = [
  { label: "Colección", href: "/coleccion", icon: UserSquare2 },
  { label: "Batallas", href: "/batallas", icon: Swords },
  { label: "Torneos", href: "/torneos", icon: Trophy },
  { label: "Ranking", href: "/ranking", icon: BarChart3 },
  { label: "Tienda", href: "/tienda", icon: ShoppingBag },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe">
      <div className="relative">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.6) 25%, rgba(168,85,247,0.6) 75%, transparent 100%)",
          }}
        />

        <div
          className="relative px-3 pt-3 pb-3 backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,10,26,0.85) 0%, rgba(3,4,12,0.95) 100%)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-stretch justify-around max-w-md mx-auto">
            {ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1",
                    "px-2 py-1 rounded-xl transition-all duration-200",
                    "min-w-[58px] active:scale-95",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center",
                      "w-11 h-11 rounded-xl transition-all duration-300",
                      active
                        ? "bg-gradient-to-br from-cyan-400/30 to-violet-500/30 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
                        : "",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6 transition-colors",
                        active ? "text-cyan-300" : "text-text-tertiary",
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {active && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-display tracking-wider uppercase transition-colors",
                      active ? "text-cyan-200" : "text-text-tertiary",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
