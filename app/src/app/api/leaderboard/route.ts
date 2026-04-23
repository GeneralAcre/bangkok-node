import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore } from "../../../utils/scoring";

const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID;

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 120_000;

const ATTENDANCE_DISC = Buffer.from([86, 179, 13, 208, 153, 204, 118, 63]);

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
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

function isHackathon(data: Buffer): boolean {
  try {
    let off = 8 + 32 + 32;
    off = readStr(data, off).next;
    off = readStr(data, off).next;
    off = readStr(data, off).next;
    off = readStr(data, off).next;
    off += 8 + 8 + 8 + 8;
    off = readStr(data, off).next;
    off += 1 + 8 + 1 + 1 + 8;
    return data.length > off && data[off] !== 0;
  } catch { return false; }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return NextResponse.json(cache.data);
  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) return NextResponse.json({ entries: [] });

  try {
    const conn      = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const community = new PublicKey(COMMUNITY_PDA);
    const prog      = new PublicKey(PROGRAM_ID_STR);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ entries: [] });

    const count  = communityEventCount(commInfo.data);
    const ePDAs  = Array.from({ length: count }, (_, i) => ePDA(community, i, prog));
    const evInfos = await conn.getMultipleAccountsInfo(ePDAs);

    const hackathonSet = new Set<string>(
      ePDAs.filter((_, i) => evInfos[i] && isHackathon(evInfos[i]!.data)).map(p => p.toBase58())
    );

    // Fetch all accounts owned by the program, slice just the first 72 bytes:
    // discriminator(8) + event_pubkey(32) + attendee_pubkey(32)
    const raw = await conn.getProgramAccounts(prog, {
      dataSlice: { offset: 0, length: 72 },
    });

    const map = new Map<string, Set<string>>();
    for (const { account } of raw) {
      const d = Buffer.from(account.data);
      if (d.length < 72 || !d.slice(0, 8).equals(ATTENDANCE_DISC)) continue;
      const ev       = new PublicKey(d.slice(8,  40)).toBase58();
      const attendee = new PublicKey(d.slice(40, 72)).toBase58();
      if (!map.has(attendee)) map.set(attendee, new Set());
      map.get(attendee)!.add(ev);
    }

    const entries = Array.from(map.entries())
      .map(([wallet, evs]) => {
        const ec = evs.size;
        const hc = Array.from(evs).filter(e => hackathonSet.has(e)).length;
        const { score, tier } = computeStrataScore(ec, hc);
        return { wallet, score, tier, eventCount: ec, hackathonCount: hc };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    const result = { entries, updatedAt: Date.now() };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[leaderboard]", e);
    return NextResponse.json({ entries: [], error: e?.message }, { status: 500 });
  }
}
