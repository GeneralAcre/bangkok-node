// In-memory store — resets on cold starts.
// Replace with a database (e.g. Postgres, Supabase) for production.

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

// Singleton map shared across all requests in the same process
export const claims = new Map<string, AchievementClaim>();

export function pointsForRank(rank: string): number {
  const r = rank.toLowerCase();
  if (r.includes("grand") || r.includes("1st") || r.includes("first")) return 1000;
  if (r.includes("2nd") || r.includes("second") || r.includes("runner")) return 500;
  return 300;
}
