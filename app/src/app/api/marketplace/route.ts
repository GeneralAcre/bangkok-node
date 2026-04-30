import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore, StrataScoreTier } from "../../../utils/scoring";

const RPC_URL       = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID;
const POST_FEE_SOL   = 0.05; // display only — enforce on-chain when program is deployed

const TIER_RANK: Record<StrataScoreTier, number> = {
  Initiate: 0, Seeker: 1, Resident: 2, Builder: 3, Core: 4, Legend: 5,
};

export type RoleType   = "Full-Time" | "Part-Time" | "Bounty" | "Contract";
export type ListingStatus = "active" | "filled" | "cancelled";

export interface Listing {
  id:          string;
  poster:      string;         // wallet pubkey
  orgName:     string;
  title:       string;
  description: string;
  roleType:    RoleType;
  compensation:string;
  location:    string;
  minTier:     StrataScoreTier | "Any";
  status:      ListingStatus;
  applications:number;
  createdAt:   number;
  expiresAt:   number;
}

// ─── In-memory store (survives across requests, resets on redeploy) ──────────
// Swap this Map for Upstash KV / Supabase when moving to production.

const store = new Map<string, Listing>();

function seed() {
  const now = Date.now();
  const day = 86_400_000;
  const demos: Listing[] = [
    {
      id: "demo-1", poster: "DEMO", orgName: "Colosseum Labs",
      title: "Senior Solana Protocol Engineer",
      description: "Build the next layer of on-chain infrastructure. You'll own core program design, security reviews, and devnet→mainnet deployments. Strong Anchor + Rust required.",
      roleType: "Full-Time", compensation: "$12k – $18k / mo",
      location: "Remote", minTier: "Builder",
      status: "active", applications: 7, createdAt: now - 2 * day, expiresAt: now + 28 * day,
    },
    {
      id: "demo-2", poster: "DEMO", orgName: "Phantom Ventures",
      title: "DeFi Protocol Security Audit",
      description: "Full audit of a new AMM contract (3k lines Anchor). Deliverable: written report + PoC exploits. 2-week engagement.",
      roleType: "Bounty", compensation: "5 SOL",
      location: "Remote", minTier: "Core",
      status: "active", applications: 3, createdAt: now - 1 * day, expiresAt: now + 14 * day,
    },
    {
      id: "demo-3", poster: "DEMO", orgName: "Wormhole Foundation",
      title: "Head of Ecosystem Development",
      description: "Shape the cross-chain developer ecosystem. Build partnerships, run hackathons, and represent Wormhole at global events. Legend-tier proof of presence required — no exceptions.",
      roleType: "Full-Time", compensation: "$20k / mo + tokens",
      location: "Bangkok / Remote", minTier: "Legend",
      status: "active", applications: 1, createdAt: now - 3 * day, expiresAt: now + 21 * day,
    },
    {
      id: "demo-4", poster: "DEMO", orgName: "Superteam Thailand",
      title: "Community Growth Manager",
      description: "Grow the Thai Web3 builder scene. Organize meetups, manage social, onboard new devs. Perfect first role in the ecosystem.",
      roleType: "Part-Time", compensation: "1,500 USDC / mo",
      location: "Bangkok", minTier: "Seeker",
      status: "active", applications: 12, createdAt: now - 5 * day, expiresAt: now + 25 * day,
    },
    {
      id: "demo-5", poster: "DEMO", orgName: "Tensor Protocol",
      title: "NFT Marketplace Frontend",
      description: "Build React components for on-chain NFT trading. Integrate wallet adapters, real-time price feeds, and compressed NFT display. 4-week contract.",
      roleType: "Contract", compensation: "3 SOL",
      location: "Remote", minTier: "Resident",
      status: "active", applications: 9, createdAt: now - 4 * day, expiresAt: now + 10 * day,
    },
    {
      id: "demo-6", poster: "DEMO", orgName: "Jito Labs",
      title: "MEV Research & Validator Optimization",
      description: "Deep research into Solana MEV strategies and validator tip routing. Publish findings. Must have proven on-chain presence — Legend only.",
      roleType: "Bounty", compensation: "15 SOL",
      location: "Remote", minTier: "Legend",
      status: "active", applications: 0, createdAt: now - 1 * day, expiresAt: now + 30 * day,
    },
  ];
  for (const l of demos) store.set(l.id, l);
}
seed();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ATTENDANCE_DISC = Buffer.from([86, 179, 13, 208, 153, 204, 118, 63]);

async function getWalletTier(wallet: string): Promise<StrataScoreTier> {
  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) return "Initiate";
  try {
    const conn = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const prog = new PublicKey(PROGRAM_ID_STR);
    // Fetch all attendance for this wallet (same approach as leaderboard)
    const raw  = await conn.getProgramAccounts(prog, {
      dataSlice: { offset: 0, length: 72 },
      filters: [{ memcmp: { offset: 40, bytes: wallet } }],
    });
    const community = new PublicKey(COMMUNITY_PDA);
    const commInfo  = await conn.getAccountInfo(community);
    // Build hackathon event set (simplified: assume no hackathon bonus for this lookup)
    let eventCount = 0; let hackCount = 0;
    const seen = new Set<string>();
    for (const { account } of raw) {
      const d = Buffer.from(account.data);
      if (d.length < 72 || !d.slice(0, 8).equals(ATTENDANCE_DISC)) continue;
      const ev = new PublicKey(d.slice(8, 40)).toBase58();
      if (!seen.has(ev)) { seen.add(ev); eventCount++; }
    }
    const { tier } = computeStrataScore(eventCount, hackCount);
    return tier;
  } catch { return "Initiate"; }
}

// ─── GET /api/marketplace ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const now = Date.now();
  const active = Array.from(store.values())
    .filter(l => l.status === "active" && l.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({
    listings: active,
    total: active.length,
    feeSOL: POST_FEE_SOL,
  });
}

// ─── POST /api/marketplace ────────────────────────────────────────────────────
// Body: { poster, orgName, title, description, roleType, compensation, location, minTier, daysActive }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { poster, orgName, title, description, roleType, compensation, location, minTier, daysActive } = body;

    if (!poster || !title || !orgName || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (title.length > 64 || orgName.length > 64 || description.length > 512) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 });
    }

    // Verify poster has at least Seeker tier to post
    const posterTier = await getWalletTier(poster);
    if (TIER_RANK[posterTier] < 1) {
      return NextResponse.json({ error: "You need at least Seeker tier to post listings" }, { status: 403 });
    }

    const id   = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now  = Date.now();
    const days = Math.min(Math.max(parseInt(daysActive ?? "30"), 1), 90);

    const listing: Listing = {
      id,
      poster,
      orgName:     orgName.trim(),
      title:       title.trim(),
      description: description.trim(),
      roleType:    roleType ?? "Full-Time",
      compensation: (compensation ?? "").trim(),
      location:    (location ?? "Remote").trim(),
      minTier:     minTier ?? "Any",
      status:      "active",
      applications: 0,
      createdAt:   now,
      expiresAt:   now + days * 86_400_000,
    };

    store.set(id, listing);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
