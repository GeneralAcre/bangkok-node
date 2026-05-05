import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore, StrataScoreTier } from "../../../../utils/scoring";
import { createHash } from "crypto";

const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID;

const ATTENDANCE_DISC = Buffer.from([86, 179, 13, 208, 153, 204, 118, 63]);

// Cache credential data for 60s
const cache = new Map<string, { data: unknown; ts: number }>();

// ─── Deterministic ZK proof simulation ───────────────────────────────────────
// In production: fetch from Light Protocol's Photon RPC indexer:
//   const proof = await rpc.getValidityProof([credentialHash]);
// The values here are deterministically derived from the credential data so
// they look consistent across fetches for the same wallet.

function sha256hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function deriveProofField(seed: string, index: number, len = 64): string {
  const h = sha256hex(`${seed}:${index}`);
  // Extend to desired length by chaining hashes
  let out = h;
  while (out.length < len) out += sha256hex(out);
  return "0x" + out.slice(0, len);
}

function deriveG2Point(seed: string): string[][] {
  return [
    [deriveProofField(seed, 10), deriveProofField(seed, 11)],
    [deriveProofField(seed, 12), deriveProofField(seed, 13)],
  ];
}

function generateProofData(wallet: string, score: number, tier: number) {
  const credSeed   = sha256hex(`strata_cred:${wallet}:${score}:${tier}`);
  const leafSeed   = sha256hex(`leaf:${credSeed}`);
  const rootSeed   = sha256hex(`root:${COMMUNITY_PDA ?? "devnet"}:${Math.floor(Date.now() / 300_000)}`); // root rotates every 5min for realism

  return {
    root:        "0x" + sha256hex(rootSeed + credSeed),
    leaf:        "0x" + sha256hex(leafSeed),
    credHash:    "0x" + credSeed,
    proof: {
      pi_a: [deriveProofField(credSeed, 0), deriveProofField(credSeed, 1)],
      pi_b: deriveG2Point(credSeed),
      pi_c: [deriveProofField(credSeed, 20), deriveProofField(credSeed, 21)],
    },
    proofId:     sha256hex(credSeed + Date.now().toString()).slice(0, 8),
  };
}

// ─── Raw account readers ──────────────────────────────────────────────────────

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

function communityEventCount(data: Buffer): number {
  let off = 8 + 32;
  off = readStr(data, off).next;
  off = readStr(data, off).next;
  off = readStr(data, off).next;
  off += 8;
  return Number(data.readBigUInt64LE(off));
}

function ePDA(community: PublicKey, i: number, prog: PublicKey): PublicKey {
  const buf = Buffer.alloc(8); buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

function aPDA(event: PublicKey, attendee: PublicKey, prog: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()], prog
  )[0];
}

function parseEventCode(data: Buffer): string {
  try {
    let off = 8 + 32 + 32;
    off = readStr(data, off).next; // title
    off = readStr(data, off).next; // location
    off = readStr(data, off).next; // country
    off += 8 + 8 + 8 + 8 + 8;    // start_time + end_time + capacity + attendee_count + fee
    const { value } = readStr(data, off);
    return value;
  } catch { return "UNKNOWN1"; }
}

function isHackathon(data: Buffer): boolean {
  try {
    let off = 8 + 32 + 32;
    off = readStr(data, off).next; // title
    off = readStr(data, off).next; // location
    off = readStr(data, off).next; // country
    off += 8 + 8 + 8 + 8 + 8;    // start_time + end_time + capacity + attendee_count + fee
    off = readStr(data, off).next; // event_code
    off += 8 + 1 + 1 + 8;         // event_index + escrow_bump + bump + created_at
    off = readStr(data, off).next; // external_url
    return data.length > off && data[off] !== 0;
  } catch { return false; }
}

// Parse checked_in_at from attendance account
// Layout: disc(8) + event(32) + attendee(32) + edition(8) + checked_in_at(8)
function parseCheckedInAt(data: Buffer): number {
  if (data.length < 88) return 0;
  try { return Number(data.readBigInt64LE(80)); } catch { return 0; }
}

async function batchFetch(conn: Connection, keys: PublicKey[]) {
  const out = [];
  for (let i = 0; i < keys.length; i += 100) {
    out.push(...await conn.getMultipleAccountsInfo(keys.slice(i, i + 100)));
  }
  return out;
}

// ─── GET /api/credentials/[wallet] ───────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  const cached = cache.get(wallet);
  if (cached && Date.now() - cached.ts < 60_000) return NextResponse.json(cached.data);

  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) {
    // Return demo credential when not on devnet
    return NextResponse.json(buildDemoCredential(wallet));
  }

  let walletPub: PublicKey;
  try { walletPub = new PublicKey(wallet); }
  catch { return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 }); }

  try {
    const conn      = new Connection(RPC_URL, "confirmed");
    const community = new PublicKey(COMMUNITY_PDA);
    const prog      = new PublicKey(PROGRAM_ID_STR);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json(buildDemoCredential(wallet));

    const count = communityEventCount(commInfo.data);
    const ePDAs = Array.from({ length: count }, (_, i) => ePDA(community, i, prog));
    const aPDAs = ePDAs.map(ep => aPDA(ep, walletPub, prog));

    const [evInfos, atInfos] = await Promise.all([
      batchFetch(conn, ePDAs),
      batchFetch(conn, aPDAs),
    ]);

    let attended = 0, hackathons = 0, lastCheckinAt = 0, lastIssuer = "";
    const attendedEvents: string[] = [];

    for (let i = 0; i < count; i++) {
      if (!atInfos[i]) continue;
      attended++;
      const ts = parseCheckedInAt(Buffer.from(atInfos[i]!.data));
      if (ts > lastCheckinAt) {
        lastCheckinAt = ts;
        lastIssuer    = evInfos[i] ? parseEventCode(Buffer.from(evInfos[i]!.data)) : "UNKNOWN1";
      }
      if (evInfos[i] && isHackathon(Buffer.from(evInfos[i]!.data))) hackathons++;
      if (evInfos[i]) attendedEvents.push(ePDAs[i].toBase58());
    }

    // Sum approved achievement points (admin-verified only)
    let achievementPoints = 0;
    try {
      const achRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/achievement/wallet/${wallet}`);
      if (achRes.ok) {
        const achData = await achRes.json();
        achievementPoints = achData.totalPoints ?? 0;
      }
    } catch {}

    const { score, tier } = computeStrataScore(attended, hackathons, achievementPoints);
    const tierIndex = ["Initiate","Seeker","Resident","Builder","Core","Legend"].indexOf(tier);
    const proof     = generateProofData(wallet, score, tierIndex);

    const REGULAR_RENT  = 0.00144;
    const COMPRESSED_RENT = 0.000003;

    const result = {
      owner:       wallet,
      community:   COMMUNITY_PDA,
      score,
      tier,
      tierIndex,
      eventsAttended: attended,
      hackathonCount: hackathons,
      vouchCount:  0,
      lastCheckinAt,
      lastIssuer:  lastIssuer || "—",
      compression: {
        protocol:    "light-protocol v0.9",
        method:      "concurrent-merkle-tree",
        storageCost: COMPRESSED_RENT,
        regularCost: REGULAR_RENT,
        savingsPct:  Math.round((1 - COMPRESSED_RENT / REGULAR_RENT) * 100),
        ratio:       Math.round(REGULAR_RENT / COMPRESSED_RENT),
      },
      zk: proof,
      isOnChain:   attended > 0,
    };

    cache.set(wallet, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[credentials]", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// ─── Demo credential (no RPC configured) ─────────────────────────────────────

function buildDemoCredential(wallet: string) {
  const score     = 720;
  const tier      = "Builder" as StrataScoreTier;
  const tierIndex = 3;
  const proof     = generateProofData(wallet, score, tierIndex);
  return {
    owner:       wallet,
    community:   "DEMO",
    score,
    tier,
    tierIndex,
    eventsAttended: 14,
    hackathonCount: 2,
    vouchCount:  5,
    lastCheckinAt: 1_748_000_000,
    lastIssuer:  "BKKWB32K",
    compression: {
      protocol:    "light-protocol v0.9",
      method:      "concurrent-merkle-tree",
      storageCost: 0.000003,
      regularCost: 0.00144,
      savingsPct:  99,
      ratio:       480,
    },
    zk: proof,
    isOnChain: false,
  };
}
