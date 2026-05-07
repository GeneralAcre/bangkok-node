export interface AchievementClaim {
  id:             string;
  wallet:         string;
  hackathonName:  string;
  projectUrl:     string;
  rank:           string;
  description:    string;
  submittedAt:    number;
  status:         "pending" | "approved" | "rejected";
  approvedAt?:    number;
  nftMint?:       string;
  points?:        number;
}

// Module-level singleton — persists across requests within the same warm serverless instance
const store = new Map<string, AchievementClaim>();

export async function getClaim(id: string) { return store.get(id) ?? null; }
export async function setClaim(c: AchievementClaim) { store.set(c.id, c); }
export async function getAllClaims() { return Array.from(store.values()); }

// Legacy sync export used by leaderboard
export const claims = store;

export function pointsForRank(rank: string): number {
  const r = rank.toLowerCase();
  if (r.includes("grand") || r.includes("1st") || r.includes("first")) return 1000;
  if (r.includes("2nd") || r.includes("second") || r.includes("runner")) return 500;
  return 300;
}
