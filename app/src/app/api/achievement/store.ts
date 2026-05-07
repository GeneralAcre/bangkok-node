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

// ── KV helpers (Vercel KV in prod, in-memory fallback for local dev) ──────────

let kv: typeof import("@vercel/kv").kv | null = null;

async function getKV() {
  if (kv) return kv;
  try {
    // Only available when KV_REST_API_URL env var is set (Vercel KV connected)
    if (process.env.KV_REST_API_URL) {
      const mod = await import("@vercel/kv");
      kv = mod.kv;
      return kv;
    }
  } catch { /* not installed or not configured */ }
  return null;
}

const KV_KEY = "achievement_claims";

// In-memory fallback for local dev
const memStore = new Map<string, AchievementClaim>();

// ── Public API ────────────────────────────────────────────────────────────────

export async function getClaim(id: string): Promise<AchievementClaim | null> {
  const store = await getKV();
  if (store) {
    const all = await store.hget<Record<string, AchievementClaim>>(KV_KEY, id);
    return all ?? null;
  }
  return memStore.get(id) ?? null;
}

export async function setClaim(claim: AchievementClaim): Promise<void> {
  const store = await getKV();
  if (store) {
    await store.hset(KV_KEY, { [claim.id]: claim });
    return;
  }
  memStore.set(claim.id, claim);
}

export async function getAllClaims(): Promise<AchievementClaim[]> {
  const store = await getKV();
  if (store) {
    const hash = await store.hgetall<Record<string, AchievementClaim>>(KV_KEY);
    if (!hash) return [];
    return Object.values(hash);
  }
  return Array.from(memStore.values());
}

// ── Legacy synchronous shim — used by leaderboard route ──────────────────────
// Returns the in-memory map (may be stale on Vercel; leaderboard rehydrates separately)
export const claims = memStore;

export function pointsForRank(rank: string): number {
  const r = rank.toLowerCase();
  if (r.includes("grand") || r.includes("1st") || r.includes("first")) return 1000;
  if (r.includes("2nd") || r.includes("second") || r.includes("runner")) return 500;
  return 300;
}
