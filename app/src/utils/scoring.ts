export type StrataScoreTier = "Initiate" | "Seeker" | "Resident" | "Builder" | "Core" | "Legend";

export interface StrataScore {
  score:          number;
  tier:           StrataScoreTier;
  eventCount:     number;
  hackathonCount: number;
}

export const SCORE_TIER_BONUS: Record<StrataScoreTier, number> = {
  Initiate: 0,
  Seeker:   50,
  Resident: 100,
  Builder:  200,
  Core:     350,
  Legend:   500,
};

export const SCORE_TIER_COLOR: Record<StrataScoreTier, string> = {
  Initiate: "#6b7280",
  Seeker:   "#3b82f6",
  Resident: "#10b981",
  Builder:  "#f59e0b",
  Core:     "#ef4444",
  Legend:   "#a855f7",
};

export const SCORE_TIER_BG: Record<StrataScoreTier, string> = {
  Initiate: "rgba(107,114,128,.15)",
  Seeker:   "rgba(59,130,246,.15)",
  Resident: "rgba(16,185,129,.15)",
  Builder:  "rgba(245,158,11,.15)",
  Core:     "rgba(239,68,68,.15)",
  Legend:   "rgba(168,85,247,.15)",
};

export const SCORE_TIER_ICON: Record<StrataScoreTier, string> = {
  Initiate: "◦",
  Seeker:   "◈",
  Resident: "⬡",
  Builder:  "✦",
  Core:     "⬟",
  Legend:   "✺",
};

const TIER_THRESHOLDS: Array<[number, StrataScoreTier]> = [
  [2000, "Legend"],
  [1000, "Core"],
  [500,  "Builder"],
  [250,  "Resident"],
  [100,  "Seeker"],
  [0,    "Initiate"],
];

export function tierFromScore(score: number): StrataScoreTier {
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (score >= threshold) return tier;
  }
  return "Initiate";
}

export function computeStrataScore(eventCount: number, hackathonCount: number): StrataScore {
  const base  = (eventCount * 10) + (hackathonCount * 30);
  const tier  = tierFromScore(base);
  const score = base + SCORE_TIER_BONUS[tier];
  return { score, tier: tierFromScore(score), eventCount, hackathonCount };
}
