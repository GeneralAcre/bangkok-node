import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL       = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID    = process.env.NEXT_PUBLIC_PROGRAM_ID;

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000;

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

function eventPDA(community: PublicKey, index: bigint, programId: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), community.toBuffer(), buf],
    programId
  )[0];
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return NextResponse.json(cache.data);
  if (!COMMUNITY_PDA || !PROGRAM_ID) return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [] });

  try {
    const conn      = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const community = new PublicKey(COMMUNITY_PDA);
    const programId = new PublicKey(PROGRAM_ID);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [] });

    // Community: disc(8) + authority(32) + name(str) + description(str) + country(str)
    //            + member_count(u64) + event_count(u64)
    let off = 8 + 32;
    off = readStr(commInfo.data, off).next; // name
    off = readStr(commInfo.data, off).next; // description
    off = readStr(commInfo.data, off).next; // country
    const memberCount = Number(commInfo.data.readBigUInt64LE(off)); off += 8;
    const eventCount  = Number(commInfo.data.readBigUInt64LE(off));

    const pdas   = Array.from({ length: eventCount }, (_, i) => eventPDA(community, BigInt(i), programId));
    const infos  = await conn.getMultipleAccountsInfo(pdas);

    const eventsData: Array<{
      title: string; location: string; country: string; status: string;
      attendeeCount: number; capacity: number; eventCode: string; eventDate: number;
      eventIndex: number; organizer: string;
    }> = [];
    let totalCheckins = 0;

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      if (!info) continue;
      try {
        const d = info.data;
        // Event: disc(8) + community(32) + organizer(32) + title(str) + description(str)
        //        + location(str) + country(str) + event_date(8) + capacity(8)
        //        + attendee_count(8) + fee(8) + event_code(str) + status(1)
        let o = 8 + 32;
        const organizer   = new PublicKey(d.slice(o, o + 32)).toBase58(); o += 32;
        const title       = readStr(d, o); o = title.next;
        o = readStr(d, o).next;             // description (skip)
        const location    = readStr(d, o); o = location.next;
        const country     = readStr(d, o); o = country.next;
        const eventDate   = Number(d.readBigUInt64LE(o)); o += 8;
        const capacity      = Number(d.readBigUInt64LE(o)); o += 8;
        const attendeeCount = Number(d.readBigUInt64LE(o)); o += 8;
        o += 8;                             // fee
        const eventCode   = readStr(d, o); o = eventCode.next;
        const statusByte  = d[o];
        const status      = statusByte === 1 ? "Live" : statusByte === 2 ? "Ended" : "Upcoming";

        totalCheckins += attendeeCount;
        eventsData.push({ title: title.value, location: location.value, country: country.value, status, attendeeCount, capacity, eventCode: eventCode.value, eventDate, eventIndex: i, organizer });
      } catch {}
    }

    eventsData.reverse(); // newest first
    const result = {
      events:       eventCount,
      members:      memberCount,
      checkins:     totalCheckins,
      allEvents:    eventsData,
      recentEvents: eventsData.slice(0, 4),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [], error: e?.message });
  }
}
