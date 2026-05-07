import fs from "fs";
import path from "path";

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

const DATA_DIR  = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "claims.json");

function load(): Map<string, AchievementClaim> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) return new Map();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const arr: AchievementClaim[] = JSON.parse(raw);
    return new Map(arr.map(c => [c.id, c]));
  } catch {
    return new Map();
  }
}

function save(map: Map<string, AchievementClaim>) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(map.values()), null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save claims:", e);
  }
}

// Proxy so callers use claims.get/set/values just like before,
// but every mutation is persisted to disk.
export const claims = new Proxy(load(), {
  get(target, prop) {
    if (prop === "set") {
      return (key: string, value: AchievementClaim) => {
        target.set(key, value);
        save(target);
        return target;
      };
    }
    if (prop === "delete") {
      return (key: string) => {
        const r = target.delete(key);
        save(target);
        return r;
      };
    }
    // Reload from disk on every read so different serverless instances see fresh data
    if (prop === "values" || prop === "get" || prop === "has" || prop === "size") {
      const fresh = load();
      // sync target in-place
      target.clear();
      fresh.forEach((v, k) => target.set(k, v));
    }
    const val = (target as any)[prop];
    return typeof val === "function" ? val.bind(target) : val;
  },
});

export function pointsForRank(rank: string): number {
  const r = rank.toLowerCase();
  if (r.includes("grand") || r.includes("1st") || r.includes("first")) return 1000;
  if (r.includes("2nd") || r.includes("second") || r.includes("runner")) return 500;
  return 300;
}
