"use client";

import { cn } from "@/lib/cn";

interface Trophy3DProps {
  className?: string;
  size?: number;
}

const RAY_LINES = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x1: round(100 + Math.cos(angle) * 60),
    y1: round(100 + Math.sin(angle) * 60),
    x2: round(100 + Math.cos(angle) * 110),
    y2: round(100 + Math.sin(angle) * 110),
  };
});

export function Trophy3D({ className, size = 280 }: Trophy3DProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.3) 30%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 blur-2xl opacity-50 animate-[pulse_4s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 65%)",
        }}
      />

      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full opacity-50"
        aria-hidden
      >
        <defs>
          <linearGradient id="ray" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        {RAY_LINES.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#ray)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full drop-shadow-[0_20px_30px_rgba(251,191,36,0.45)]"
        style={{
          filter:
            "drop-shadow(0 0 24px rgba(251,191,36,0.6)) drop-shadow(0 0 48px rgba(251,191,36,0.35))",
        }}
      >
        <defs>
          <linearGradient id="goldMain" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="35%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <radialGradient id="trophyGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M 55 60 Q 30 65, 30 90 Q 30 110, 55 105"
          fill="none"
          stroke="url(#goldMain)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M 145 60 Q 170 65, 170 90 Q 170 110, 145 105"
          fill="none"
          stroke="url(#goldMain)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          d="M 50 50 L 50 95 Q 50 130, 100 145 Q 150 130, 150 95 L 150 50 Z"
          fill="url(#goldMain)"
          stroke="#92400e"
          strokeWidth="1.5"
        />

        <path
          d="M 60 55 L 60 95 Q 60 120, 100 132 Q 140 120, 140 95 L 140 55 Z"
          fill="url(#trophyGlow)"
          opacity="0.7"
        />

        <path
          d="M 65 55 L 80 55 L 75 130 L 60 120 Z"
          fill="url(#goldHighlight)"
          opacity="0.5"
        />

        <rect x="50" y="55" width="100" height="6" fill="#92400e" opacity="0.4" />

        <rect x="92" y="145" width="16" height="18" fill="url(#goldMain)" />
        <rect x="92" y="148" width="16" height="2" fill="#92400e" opacity="0.4" />
        <rect x="92" y="158" width="16" height="2" fill="#92400e" opacity="0.4" />

        <path
          d="M 70 163 L 130 163 L 138 175 L 62 175 Z"
          fill="url(#goldMain)"
          stroke="#92400e"
          strokeWidth="1.5"
        />
        <rect x="58" y="175" width="84" height="8" fill="url(#goldMain)" stroke="#92400e" strokeWidth="1" />

        <path
          d="M 100 80 L 104 92 L 116 92 L 106 100 L 110 112 L 100 104 L 90 112 L 94 100 L 84 92 L 96 92 Z"
          fill="#fef3c7"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
