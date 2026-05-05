import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore } from "../../../utils/scoring";
import { claims } from "../achievement/store";

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

function parseCommunityInfo(data: Buffer): { name: string; country: string; eventCount: number } {
  let off = 8 + 32;
  const { value: name, next: o1 } = readStr(data, off);
  const { next: o2 }              = readStr(data, o1);   // skip description
  const { value: country, next: o3 } = readStr(data, o2);
  off = o3 + 8; // skip member_count
  return { name, country, eventCount: Number(data.readBigUInt64LE(off)) };
}

function parseMemberUsername(data: Buffer): string {
  try {
    return readStr(data, 8 + 32 + 32).value; // discriminator + wallet + community
  } catch { return ""; }
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

function ePDA(community: PublicKey, i: number, prog: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return NextResponse.json(cache.data);
  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) return NextResponse.json({ entries: [], community: null });

  try {
    const conn      = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const community = new PublicKey(COMMUNITY_PDA);
    const prog      = new PublicKey(PROGRAM_ID_STR);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ entries: [], community: null });

    const { name: communityName, country: communityCountry, eventCount: count } =
      parseCommunityInfo(commInfo.data);

    const ePDAs   = Array.from({ length: count }, (_, i) => ePDA(community, i, prog));
    const evInfos = await conn.getMultipleAccountsInfo(ePDAs);

    const hackathonSet = new Set<string>(
      ePDAs.filter((_, i) => evInfos[i] && isHackathon(evInfos[i]!.data)).map(p => p.toBase58())
    );

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

    const sorted = Array.from(map.entries())
      .map(([wallet, evs]) => {
        const ec = evs.size;
        const hc = Array.from(evs).filter(e => hackathonSet.has(e)).length;
        const ap = Array.from(claims.values())
          .filter(c => c.wallet === wallet && c.status === "approved")
          .reduce((sum, c) => sum + (c.points ?? 0), 0);
        const { score, tier } = computeStrataScore(ec, hc, ap);
        return { wallet, score, tier, eventCount: ec, hackathonCount: hc };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    // Batch-fetch member accounts to get usernames
    const memberPDAs = sorted.map(e =>
      PublicKey.findProgramAddressSync(
        [Buffer.from("member"), community.toBuffer(), new PublicKey(e.wallet).toBuffer()],
        prog
      )[0]
    );
    const memberInfos = await conn.getMultipleAccountsInfo(memberPDAs);
    const usernameMap: Record<string, string> = {};
    sorted.forEach((e, i) => {
      if (memberInfos[i]?.data) {
        const u = parseMemberUsername(Buffer.from(memberInfos[i]!.data));
        if (u) usernameMap[e.wallet] = u;
      }
    });

    const entries = sorted.map(e => ({
      ...e,
      username: usernameMap[e.wallet] ?? "",
    }));

    const result = {
      entries,
      updatedAt: Date.now(),
      community: { name: communityName, country: communityCountry },
    };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[leaderboard]", e);
    return NextResponse.json({ entries: [], community: null, error: e?.message }, { status: 500 });
  }
}
