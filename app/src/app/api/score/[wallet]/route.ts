import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeStrataScore } from "../../../../utils/scoring";
import { claims } from "../../achievement/store";

const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID;

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

function communityEventCount(data: Buffer): number {
  let off = 8 + 32;               // disc + authority
  off = readStr(data, off).next;  // name
  off = readStr(data, off).next;  // description
  off = readStr(data, off).next;  // country
  off += 8;                       // member_count
  return Number(data.readBigUInt64LE(off));
}

function ePDA(community: PublicKey, i: number, prog: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

function aPDA(event: PublicKey, attendee: PublicKey, prog: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()], prog
  )[0];
}

function isHackathon(data: Buffer): boolean {
  try {
    let off = 8 + 32 + 32;
    off = readStr(data, off).next; // title
    off = readStr(data, off).next; // description
    off = readStr(data, off).next; // location
    off = readStr(data, off).next; // country
    off += 8 + 8 + 8 + 8;         // event_date + capacity + attendee_count + fee
    off = readStr(data, off).next; // event_code
    off += 1 + 8 + 1 + 1 + 8;    // status + event_index + escrow_bump + bump + created_at
    return data.length > off && data[off] !== 0;
  } catch { return false; }
}

async function batchFetch(conn: Connection, keys: PublicKey[]) {
  const out = [];
  for (let i = 0; i < keys.length; i += 100) {
    out.push(...await conn.getMultipleAccountsInfo(keys.slice(i, i + 100)));
  }
  return out;
}

export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  if (!COMMUNITY_PDA || !PROGRAM_ID_STR) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  let wallet: PublicKey;
  try { wallet = new PublicKey(params.wallet); }
  catch { return NextResponse.json({ error: "Invalid wallet" }, { status: 400 }); }

  try {
    const conn      = new Connection(RPC_URL, "confirmed");
    const community = new PublicKey(COMMUNITY_PDA);
    const prog      = new PublicKey(PROGRAM_ID_STR);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ score: 0, tier: "Initiate", eventCount: 0, hackathonCount: 0, isVerified: true });

    const count  = communityEventCount(commInfo.data);
    const ePDAs  = Array.from({ length: count }, (_, i) => ePDA(community, i, prog));
    const aPDAs  = ePDAs.map(ep => aPDA(ep, wallet, prog));

    const [evInfos, atInfos] = await Promise.all([batchFetch(conn, ePDAs), batchFetch(conn, aPDAs)]);

    let attended = 0, hackathons = 0;
    for (let i = 0; i < count; i++) {
      if (!atInfos[i]) continue;
      attended++;
      if (evInfos[i] && isHackathon(evInfos[i]!.data)) hackathons++;
    }

    const achievementPoints = Array.from(claims.values())
      .filter(c => c.wallet === params.wallet && c.status === "approved")
      .reduce((sum, c) => sum + (c.points ?? 0), 0);

    return NextResponse.json({ ...computeStrataScore(attended, hackathons, achievementPoints), isVerified: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
