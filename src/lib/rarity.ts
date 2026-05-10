export type Rarity =
  | "common"
  | "pro"
  | "rare"
  | "elite"
  | "champion"
  | "legend";

export interface RarityStyle {
  label: string;
  color: string;
  borderFrom: string;
  borderTo: string;
  glow: string;
  bgGradient: string;
  textShadow: string;
}

export const RARITY_STYLES: Record<Rarity, RarityStyle> = {
  common: {
    label: "Básica",
    color: "#94a3b8",
    borderFrom: "#475569",
    borderTo: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.4)",
    bgGradient: "linear-gradient(160deg, #1e293b 0%, #334155 100%)",
    textShadow: "0 0 8px rgba(148, 163, 184, 0.5)",
  },
  pro: {
    label: "Pro",
    color: "#22d3ee",
    borderFrom: "#0891b2",
    borderTo: "#67e8f9",
    glow: "rgba(34, 211, 238, 0.55)",
    bgGradient: "linear-gradient(160deg, #0c4a6e 0%, #0e7490 100%)",
    textShadow: "0 0 10px rgba(34, 211, 238, 0.7)",
  },
  rare: {
    label: "Rara",
    color: "#3b82f6",
    borderFrom: "#1d4ed8",
    borderTo: "#60a5fa",
    glow: "rgba(59, 130, 246, 0.55)",
    bgGradient: "linear-gradient(160deg, #1e3a8a 0%, #1e40af 100%)",
    textShadow: "0 0 10px rgba(59, 130, 246, 0.7)",
  },
  elite: {
    label: "Élite",
    color: "#a855f7",
    borderFrom: "#7c3aed",
    borderTo: "#c4b5fd",
    glow: "rgba(168, 85, 247, 0.6)",
    bgGradient: "linear-gradient(160deg, #4c1d95 0%, #6d28d9 100%)",
    textShadow: "0 0 12px rgba(168, 85, 247, 0.75)",
  },
  champion: {
    label: "Campeón",
    color: "#f59e0b",
    borderFrom: "#d97706",
    borderTo: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.6)",
    bgGradient: "linear-gradient(160deg, #78350f 0%, #b45309 100%)",
    textShadow: "0 0 12px rgba(245, 158, 11, 0.8)",
  },
  legend: {
    label: "Leyenda",
    color: "#fbbf24",
    borderFrom: "#fbbf24",
    borderTo: "#fde68a",
    glow: "rgba(251, 191, 36, 0.7)",
    bgGradient: "linear-gradient(160deg, #92400e 0%, #d97706 50%, #fbbf24 100%)",
    textShadow: "0 0 14px rgba(251, 191, 36, 0.9)",
  },
};
