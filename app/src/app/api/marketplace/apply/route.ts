import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore, StrataScoreTier } from "../../../../utils/scoring";

// Re-import store reference — same module-level Map from route.ts is NOT shared
// across files in Next.js edge runtime. For production use an external store.
// For demo purposes we import from the parent route's exported store via a shared module.
// Since Next.js doesn't share module state across API routes, we use a global singleton:

const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID;

const TIER_RANK: Record<StrataScoreTier, number> = {
  Initiate: 0, Seeker: 1, Resident: 2, Builder: 3, Core: 4, Legend: 5,
};

const ATTENDANCE_DISC = Buffer.from([86, 179, 13, 208, 153, 204, 118, 63]);

// Global singleton application log (survives across requests in same process)
declare global { var _mktApplications: Map<string, { wallet: string; note: string; at: number }[]> | undefined; }
if (!global._mktApplications) global._mktApplications = new Map();
const applications = global._mktApplications;

async function getWalletTier(wallet: string): Promise<{ tier: StrataScoreTier; score: number }> {
  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) return { tier: "Initiate", score: 0 };
  try {
    const conn = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const prog = new PublicKey(PROGRAM_ID_STR);
    const raw  = await conn.getProgramAccounts(prog, {
      dataSlice: { offset: 0, length: 72 },
      filters:   [{ memcmp: { offset: 40, bytes: wallet } }],
    });
    let eventCount = 0;
    const seen = new Set<string>();
    for (const { account } of raw) {
      const d = Buffer.from(account.data);
      if (d.length < 72 || !d.slice(0, 8).equals(ATTENDANCE_DISC)) continue;
      const ev = new PublicKey(d.slice(8, 40)).toBase58();
      if (!seen.has(ev)) { seen.add(ev); eventCount++; }
    }
    const result = computeStrataScore(eventCount, 0);
    return { tier: result.tier, score: result.score };
  } catch { return { tier: "Initiate", score: 0 }; }
}

// POST /api/marketplace/apply
// Body: { listingId, wallet, note }
export async function POST(req: NextRequest) {
  try {
    const { listingId, wallet, note } = await req.json();

    if (!listingId || !wallet) {
      return NextResponse.json({ error: "listingId and wallet required" }, { status: 400 });
    }
    if ((note ?? "").length > 256) {
      return NextResponse.json({ error: "Note too long (max 256 chars)" }, { status: 400 });
    }

    // Check for duplicate application
    const existing = applications.get(listingId) ?? [];
    if (existing.some(a => a.wallet === wallet)) {
      return NextResponse.json({ error: "You have already applied to this listing" }, { status: 409 });
    }

    // Verify tier — fetch from chain
    const { tier, score } = await getWalletTier(wallet);

    // We need the listing to check minTier — fetch from the shared global store
    // (In production this would be a DB query)
    const listingMap: Map<string, any> = (global as any)._mktListings;
    if (listingMap) {
      const listing = listingMap.get(listingId);
      if (listing) {
        const minRank = TIER_RANK[listing.minTier as StrataScoreTier] ?? 0;
        if (listing.minTier !== "Any" && TIER_RANK[tier] < minRank) {
          return NextResponse.json({
            error: `This listing requires ${listing.minTier} tier. Your current tier is ${tier}.`,
          }, { status: 403 });
        }
      }
    }

    const record = { wallet, note: note ?? "", at: Date.now() };
    applications.set(listingId, [...existing, record]);

    return NextResponse.json({ ok: true, tier, score, applications: existing.length + 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

// GET /api/marketplace/apply?listingId=xxx&wallet=yyy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  const wallet    = searchParams.get("wallet");

  if (!listingId || !wallet) {
    return NextResponse.json({ applied: false });
  }
  const list    = applications.get(listingId) ?? [];
  const applied = list.some(a => a.wallet === wallet);
  return NextResponse.json({ applied, count: list.length });
}
