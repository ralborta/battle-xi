"use client";

import { cn } from "@/lib/cn";

interface BattleLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: { battle: "text-3xl", xi: "text-5xl" },
  md: { battle: "text-5xl", xi: "text-7xl" },
  lg: { battle: "text-6xl md:text-7xl", xi: "text-8xl md:text-9xl" },
  xl: { battle: "text-7xl md:text-8xl", xi: "text-9xl" },
};

export function BattleLogo({ className, size = "lg" }: BattleLogoProps) {
  const s = SIZES[size];
  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <span
        className={cn(
          "font-display italic tracking-tighter leading-none",
          s.battle,
        )}
        style={{
          color: "#fff",
          textShadow:
            "0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(34,211,238,0.5), 4px 4px 0 rgba(139,92,246,0.6)",
          transform: "skewX(-6deg)",
          letterSpacing: "-0.02em",
        }}
      >
        BATTLE
      </span>
      <span
        className={cn(
          "font-display italic leading-none -mt-2",
          s.xi,
        )}
        style={{
          background:
            "linear-gradient(135deg, #67e8f9 0%, #22d3ee 35%, #c4b5fd 70%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 40px rgba(34,211,238,0.4)",
          filter:
            "drop-shadow(0 0 20px rgba(34,211,238,0.5)) drop-shadow(0 0 40px rgba(168,85,247,0.4))",
          transform: "skewX(-6deg)",
          letterSpacing: "-0.05em",
        }}
      >
        XI
      </span>
      <svg
        viewBox="0 0 200 80"
        className="absolute -inset-x-4 bottom-2 w-[calc(100%+32px)] h-12 pointer-events-none opacity-70"
        aria-hidden
      >
        <defs>
          <linearGradient id="brush" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 10 40 Q 100 10 190 40"
          stroke="url(#brush)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
