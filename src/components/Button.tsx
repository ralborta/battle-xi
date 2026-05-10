"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "cyan" | "violet" | "gold" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-lg",
  xl: "h-16 px-8 text-xl",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  cyan:
    "text-bg-void bg-[linear-gradient(135deg,#22d3ee,#06b6d4_50%,#0891b2)] " +
    "shadow-[0_0_28px_rgba(34,211,238,0.55),0_10px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] " +
    "hover:shadow-[0_0_40px_rgba(34,211,238,0.75),0_14px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
  violet:
    "text-white bg-[linear-gradient(135deg,#a78bfa,#8b5cf6_50%,#6d28d9)] " +
    "shadow-[0_0_28px_rgba(139,92,246,0.55),0_10px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] " +
    "hover:shadow-[0_0_40px_rgba(139,92,246,0.8),0_14px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.4)]",
  gold:
    "text-bg-void bg-[linear-gradient(135deg,#fde68a,#fbbf24_50%,#f59e0b)] " +
    "shadow-[0_0_28px_rgba(251,191,36,0.55),0_10px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] " +
    "hover:shadow-[0_0_40px_rgba(251,191,36,0.8),0_14px_28px_rgba(0,0,0,0.45)]",
  ghost:
    "text-text-primary bg-white/5 border border-border-mid backdrop-blur " +
    "hover:bg-white/10 hover:border-border-strong",
  outline:
    "text-cyan-300 bg-transparent border-2 border-cyan-400/50 " +
    "hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200 " +
    "shadow-[0_0_18px_rgba(34,211,238,0.25),inset_0_0_18px_rgba(34,211,238,0.1)]",
};

export function Button({
  variant = "cyan",
  size = "lg",
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "font-display tracking-wider uppercase",
        "rounded-2xl select-none",
        "transition-all duration-200",
        "active:scale-[0.97] active:translate-y-[1px]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        fullWidth && "w-full",
        className,
      )}
    >
      {(variant === "cyan" || variant === "violet" || variant === "gold") && (
        <span
          aria-hidden
          className="absolute top-0 left-3 right-3 h-1/2 rounded-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)",
            opacity: 0.55,
          }}
        />
      )}
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10 leading-none">{children}</span>
      {iconRight && <span className="relative z-10">{iconRight}</span>}
    </button>
  );
}
